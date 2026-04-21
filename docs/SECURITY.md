# Security-Dokumentation

## Status nach Phase 11

| # | Befund | Status | Details |
|---|---|---|---|
| 1 | postMessage-Origin `"*"` | ✅ Behoben (Phase 6) | Architektur-Änderung: kein iFrame mehr |
| 2 | Rate-Limiting | ✅ Behoben (Phase 10) | WP-Transients, 3 Req/Std/IP, Cloudflare-aware |
| 3 | Captcha fehlt | ✅ Behoben (Phase 8) | Altcha (self-hosted HMAC, kein externer Service) |
| 4 | CSP + Security-Header | ✅ Behoben (Phase 11) | `class-csp.php`, kein `unsafe-inline` |
| 5 | Input-Sanitization | ✅ Behoben | Zod (Frontend) + `sanitize_text_field` (WP) |
| 6 | Honeypot | ✅ Behoben | Unsichtbares `website`-Feld, silent reject |
| 7 | Atomic Ticket-IDs | ✅ Behoben (Phase 11) | MySQL `LAST_INSERT_ID()`, kein TOCTOU |
| 8 | In-Memory Rate-Limit (dead code) | ✅ Behoben (Phase 11) | `src/lib/security/rate-limit.ts` gelöscht |
| 9 | IP-Spoofing via X-Forwarded-For | ✅ Behoben (Phase 11) | `get_client_ip()` vertraut nur CF-Connecting-IP / REMOTE_ADDR |
| 10 | XSS via `dangerouslySetInnerHTML` | ✅ Behoben (Phase 11) | InfoSpec-Migration, kein HTML mehr in Daten |
| 11 | CSP `unsafe-inline` im Plugin | ✅ Behoben (Phase 11) | Bootstrap via `data-*`-Attribute + externes `init.js` |

---

## Architektur-Überblick (ab Phase 10)

```
Browser
  └─► WordPress (kw-baustoffe.de)
        ├─ Static Export (HTML/CSS/JS, via Shortcode eingebettet)
        │    └─ React-Konfigurator (rein clientseitig)
        └─ WP REST API (/wp-json/kw-pv-tools/v1)
             ├─ Rate-Limiting     → class-rate-limit.php
             ├─ Captcha-Verify    → class-captcha.php (Altcha HMAC)
             ├─ Input-Validierung → class-submit-handler.php (Zod → PHP Sanitize)
             └─ E-Mail-Versand    → class-mailer.php (WP Mail / SMTP)
```

Vercel wird **nicht** genutzt. Alle serverseitigen Sicherheitsmaßnahmen laufen im WP-Plugin.

---

## Security-Header

Gesetzt durch `class-csp.php` via WordPress `send_headers`-Hook (nur Frontend, nicht WP-Admin).

| Header | Wert | Zweck |
|---|---|---|
| `Content-Security-Policy` | Siehe unten | XSS + Frame-Schutz |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking-Fallback für alte Browser |
| `X-Content-Type-Options` | `nosniff` | MIME-Sniffing verhindern |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer-Leak minimieren |

### CSP-Konfiguration

```
default-src 'self'
script-src 'self' 'strict-dynamic'
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob:
font-src 'self'
connect-src 'self'
frame-src 'none'
object-src 'none'
base-uri 'self'
form-action 'self'
frame-ancestors 'self' https://www.kw-baustoffe.de https://kw-baustoffe.de
```

**`unsafe-inline` für Scripts:** Nicht gesetzt. Bootstrap-Daten laufen über `data-*`-Attribute auf dem Container-Element; `assets/shared/js/init.js` liest sie aus (externes Script, CSP-konform).

**`style-src unsafe-inline`:** Bleibt, da Tailwind CSS Inline-Styles im Bundle erzeugt. Kein XSS-Risiko (Styles können keine Scripts ausführen).

**Next.js Inline-Scripts nach Build-Update:** Falls `pnpm build` neue Inline-Scripts erzeugt (z.B. `__NEXT_DATA__`), SHA-256-Hashes berechnen und in `CSP::SCRIPT_HASHES` eintragen:
```bash
echo -n "script-inhalt" | openssl dgst -sha256 -binary | base64
```

**Prüfen:** Nach Deploy mit https://securityheaders.com — Ziel: Grade A.

---

## Rate-Limiting

**Konfiguration:** 3 Submits / Stunde / IP-Adresse

**Implementierung:** `class-rate-limit.php` via WordPress Transients
- Nutzt Object-Cache wenn verfügbar (Redis-Object-Cache, Memcached) → dann atomar + verteilt
- Fallback: WordPress-Datenbank (Tabelle `wp_options`, Transients)
- Keine serverlose Instanz-Isolation: WP läuft als dauerhafter PHP-Prozess (FPM/mod_php) oder teilt eine DB

**IP-Extraktion:**
- Primär: `CF-Connecting-IP` (gesetzt von Cloudflare, nicht client-spoofbar)
- Fallback: `REMOTE_ADDR` (direkte TCP-Verbindung, immer vertrauenswürdig)
- `X-Forwarded-For` und `X-Real-IP` werden **nicht** ausgewertet — beide sind client-spoofbar

**Response bei Überschreitung:**
```
HTTP 429 Too Many Requests
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
Retry-After: <Sekunden bis Reset>
```

**Einstellbar** im WP-Admin unter „KW PV Tools → Einstellungen → Limit pro Stunde".

---

## Captcha (Bot-Schutz)

**Provider:** Altcha (Standard) — self-hosted HMAC-SHA256, kein externer Service, DSGVO-konform.

**Alternative Provider:** hCaptcha, reCAPTCHA v3 (konfigurierbar im WP-Admin).

**Captcha deaktivieren:** Im WP-Admin möglich (z.B. für interne Testsysteme). Produktion: immer aktiviert.

**Fail-closed:** Wenn HMAC-Key nicht konfiguriert ist, blockiert der Server die Submission (kein graceful fallback zu „kein Captcha"). Siehe ADR-009.

---

## Input-Sanitization

**Frontend (Zod-Schema):**
- `name`: max 100 Zeichen, `.trim()`
- `email`: RFC-konformes Format, max 200, `.toLowerCase()`
- `phone`: max 30 Zeichen
- `message`: max 2000 Zeichen
- `manufacturer`: nur `[a-z0-9-]`

**Backend (PHP):** Alle Felder durch `sanitize_text_field()` / `sanitize_email()` / `wp_kses_post()`.

**E-Mail-Templates:** `esc_html()` auf alle User-Inputs (XSS-Schutz für HTML-Mails).

---

## Honeypot-Feld

Im Kontaktformular ein unsichtbares `website`-Feld (`tabIndex={-1}`, `left: -9999px`).
- Echte User sehen es nicht und füllen es nicht aus
- Bots füllen alle Felder aus → Server gibt `200 OK` zurück (silent reject, kein Feedback für Bots)

---

## Incident Response

**Spam-Angriff auf `/wp-json/kw-pv-tools/v1/submit`:**
1. Rate-Limit prüfen: WP-Logs / Hosting-Panel auf 429-Responses prüfen
2. Limit temporär auf 1/Stunde reduzieren (WP-Admin → Einstellungen)
3. IP blockieren: Cloudflare Firewall Rule oder `.htaccess`
4. Captcha-Komplexität erhöhen (WP-Admin → Altcha-Einstellungen)

**Verdächtige Aktivität:**
- WP-Debug-Log: `wp-content/debug.log`
- Submission-Log: WP-Admin → „KW PV Tools → Submission-Log" (30-Tage-Retention)

---

## Offene Punkte

- [ ] Object-Cache-Plugin installieren (z.B. Redis Object Cache) für atomares Multi-Process Rate-Limiting
- [ ] Sentry für Error-Tracking in Produktion
- [ ] Nach jedem `pnpm build`: Next.js Inline-Script-Hashes in `CSP::SCRIPT_HASHES` prüfen

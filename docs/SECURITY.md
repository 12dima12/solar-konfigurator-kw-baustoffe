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

**Provider:** Altcha (einziger produktiver Provider) — self-hosted HMAC-SHA256, kein externer Service, DSGVO-konform.

**Modus `none`:** Nur für interne Testsysteme gedacht. Produktion: immer Altcha.

**hCaptcha / reCAPTCHA:** In Batch A (v2.2.0) entfernt. Beide Dienste sind extern (Datenschutz-Implikationen) und waren ohne CSP-Whitelisting ihrer Origins nicht lauffähig — siehe ADR-004 (historisch) und ADR-008.

**Fail-closed:** Wenn HMAC-Key nicht konfiguriert ist, blockiert der Server die Submission (kein graceful fallback zu „kein Captcha"). Siehe ADR-009.

**Replay-Schutz:** Gelöste Altcha-Tokens werden server-seitig als Fingerprint (`kw_pv_altcha_<sha256>`) im Transient-Store gespeichert (24 h TTL) — Wiederverwendung liefert HTTP 403 `reason=replay`. Siehe `class-captcha.php::verify_altcha()`.

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

## Trust Boundary: Plugin-Assets-Ordner

`class-shortcode.php` gibt Scripts, Styles und den Body-HTML-Block aus
`assets/konfigurator/` **unescaped** aus (siehe PHPCS-ignore-Kommentare im
Shortcode-Template). Das ist absichtlich — Next.js liefert pre-rendered
HTML inklusive React-Hydration-Kommentaren, Font-Preloads und CSS-
Precedence-Markern, die `esc_html()` oder `wp_kses_post()` zerstören
würden.

**Die Sicherheit dieses Outputs hängt daran, dass der Inhalt von
`assets/konfigurator/` vertrauenswürdig ist.**

**Vertrauensquelle.** Der Ordner wird **nicht** zur Laufzeit beschrieben.
Ausschließliche Schreib-Wege:

1. `./wordpress-plugin/build/sync-konfigurator.sh` — baut den Next.js-
   Static-Export und kopiert das Ergebnis.
2. Das Plugin-ZIP aus dem CI-Artefakt (`plugin-build`-Job in
   `.github/workflows/ci.yml`), das beim Upload in WP-Admin entpackt wird.
3. Ein GitHub-Release, das der `release`-Job aus genau demselben ZIP
   erzeugt; der Plugin-Update-Checker zieht daraus — aber
   **automatische** Installation ist per `auto_update_plugin`-Filter
   geblockt (ADR-014), der Admin muss klicken.

Alle drei Wege führen zurück auf `main` im Git-Repo. Ein Angreifer, der
den Inhalt ändern will, muss entweder Push-Rechte auf `main` erlangen
oder physischen Write-Zugriff auf den Plugin-Ordner auf dem Hoster.
Beides fällt unter die Standard-WP-Hardening-Annahmen (SSH/SFTP-Security,
GitHub-Account-2FA).

**Was KEIN Teil der Trust Boundary ist.** User-kontrollierter Input —
Formular-Felder, Query-Parameter, Captcha-Tokens — wird weiterhin durch
Zod (Frontend), `sanitize_text_field` / `esc_html` (Backend) geleitet.
Der Trust-Sprung gilt ausschließlich für die Bundle-Artefakte, nicht für
Request-Daten.

**Was passiert beim XSS-Test.** Das Bundle enthält (nach der
Entfernung von HTML-`info`-Feldern in Batch A) keine durch User-Daten
generierten Strings. Die einzigen variablen Teile des Bodies sind
React-Hydration-Marker und statisch gebündelte Asset-Pfade. Der
DOMDocument-Parser in Batch D1 stellt zusätzlich sicher, dass nur
`src`/`href`/`poster`/`data-src` manipuliert werden — `innerHTML`-
oder `outerHTML`-artige Reflektion findet nicht statt.

**Monitoring.** Der `plugin-build`-CI-Job läuft auf jedem PR und Push,
und ein Diff im ZIP-SHA vs. Vorgänger-Release ist nachvollziehbar. Wer
einen kompromittierten Bundle-Push vermutet, kann das ZIP-Artefakt
herunterladen und mit einem sauberen lokalen Build vergleichen.

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

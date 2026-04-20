# Security-Dokumentation

## Status nach Phase 6

| # | Blocker | Status | Details |
|---|---|---|---|
| 1 | postMessage-Origin `"*"` | ✅ Behoben | ALLOWED_ORIGINS-Whitelist, getTargetOrigin() |
| 2 | Rate-Limiting `/api/submit` | ✅ Behoben | In-Memory, 3 Req/Std/IP |
| 3 | hCaptcha fehlt | ✅ Behoben | @hcaptcha/react-hcaptcha, Server-Verify |
| 4 | CSP + X-Frame-Options | ✅ Behoben | Middleware setzt alle Header |
| 5 | Input-Sanitization | ✅ Behoben | Strikte Zod-Schemas, escapeHtml() |
| 6 | Honeypot | ✅ Behoben | Unsichtbares `website`-Feld, silent reject |
| 7 | Tests in CI | ✅ Behoben | GitHub Actions Workflow |

---

## Security-Header

Alle Header werden durch `src/middleware.ts` gesetzt.

| Header | Wert | Zweck |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | MIME-Sniffing verhindern |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer-Leak minimieren |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Browser-APIs sperren |
| `X-Frame-Options` | `DENY` (reguläre Routen) | Clickjacking-Schutz |
| `Content-Security-Policy` | Siehe unten | XSS + Frame-Schutz |

### CSP-Konfiguration

```
default-src 'self'
script-src 'self' 'unsafe-inline' 'unsafe-eval' https://hcaptcha.com https://*.hcaptcha.com
style-src 'self' 'unsafe-inline'
img-src 'self' data: https:
font-src 'self' data:
connect-src 'self' https://hcaptcha.com https://*.hcaptcha.com
frame-src https://hcaptcha.com https://*.hcaptcha.com
frame-ancestors 'none'  (reguläre Routen)
frame-ancestors https://www.kw-baustoffe.de https://kw-baustoffe.de https://kw-pv-solutions.de  (embed)
```

**Prüfen:** Nach Deploy mit https://securityheaders.com — Ziel: Grade A.

---

## Rate-Limiting

**Konfiguration:** 3 Submits / Stunde / IP-Adresse

**Implementierung:** In-Memory Sliding Window (`src/lib/security/rate-limit.ts`)
- Für Single-Instance-Deployments (Vercel single region, ein VPS): ausreichend
- Für Multi-Instance (mehrere Vercel-Regionen, Kubernetes): Upstash Redis als Upgrade

**Upgrade auf Upstash:**
```bash
pnpm add @upstash/ratelimit @upstash/redis
```
Dann in `rate-limit.ts` durch `@upstash/ratelimit` ersetzen.
Env-Variablen: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

**Response bei Überschreitung:**
```
HTTP 429 Too Many Requests
X-RateLimit-Limit: 3
X-RateLimit-Remaining: 0
Retry-After: <Sekunden bis Reset>
```

---

## hCaptcha (Bot-Schutz)

**Warum hCaptcha statt reCAPTCHA?** Datenschutzfreundlicher, DSGVO-konform ohne Einwilligung nötig, kein Google-Tracker.

**Setup:**
1. Account anlegen: https://dashboard.hcaptcha.com
2. Site hinzufügen → Site Key + Secret Key notieren
3. In Vercel/Server eintragen:
   - `NEXT_PUBLIC_HCAPTCHA_SITE_KEY=...` (Public — Frontend)
   - `HCAPTCHA_SECRET=...` (Secret — Backend only)

**Test-Keys für Entwicklung:**
- Site Key: `10000000-ffff-ffff-ffff-000000000001`
- Secret: `0x0000000000000000000000000000000000000000`

**Wenn HCAPTCHA_SECRET nicht gesetzt:** Im Dev-Mode wird Captcha-Check übersprungen (graceful fallback).

**Captcha-Flow-Test:**
1. Dev starten: `pnpm dev`
2. Test-Site-Key in `.env.local` setzen
3. Formular absenden — Captcha muss ausgefüllt sein
4. Network-Tab: POST `/api/submit` mit `captchaToken`

---

## postMessage Origin

**Erlaubte Hosts** (in `src/hooks/useIframeResize.ts` und `src/middleware.ts`):
- `https://www.kw-baustoffe.de`
- `https://kw-baustoffe.de`
- `https://kw-pv-solutions.de`

**Neue Domain einbetten:** In beiden Dateien in `ALLOWED_ORIGINS` / `EMBED_ALLOWED_HOSTS` ergänzen, dann neu deployen.

---

## Honeypot-Feld

Im Kontaktformular befindet sich ein unsichtbares `website`-Feld (`tabIndex={-1}`, `left: -9999px`).
- Echte User sehen es nicht und füllen es nicht aus
- Bots füllen alle Felder aus → Server erkennt es und gibt `200 OK` zurück (silent reject, kein Feedback für Bots)

---

## Input-Sanitization

Alle User-Inputs werden durch Zod validiert:
- `name`: max 100 Zeichen, `.trim()`
- `email`: valid format, max 200, `.toLowerCase()`
- `phone`: max 30 Zeichen
- `message`: max 2000 Zeichen
- `manufacturer`: nur `[a-z0-9-]` erlaubt

Im E-Mail-Template werden alle User-Inputs durch `escapeHtml()` geleitet (XSS-Schutz für HTML-Mails).

---

## Incident Response

**Spam-Angriff auf /api/submit:**
1. Rate-Limit prüfen: Logs zeigen `429`-Responses?
2. Falls In-Memory überläuft: Upstash Redis aktivieren
3. Notfall: Route temporär in `middleware.ts` sperren
4. hCaptcha-Score-Threshold erhöhen (Enterprise-Feature)

**Verdächtige Aktivität:**
- Logs unter Vercel → Funktions-Logs → `/api/submit` filtern
- Auf ungewöhnliche IPs, hohe Frequenz prüfen

---

## Offene Punkte (nach Phase 6)

- [ ] `unsafe-inline` + `unsafe-eval` in CSP schärfen (erfordert Nonce-Implementierung in Next.js)
- [ ] Sentry für Error-Tracking in Produktion
- [ ] Upstash Redis wenn Vercel auf mehrere Regionen skaliert

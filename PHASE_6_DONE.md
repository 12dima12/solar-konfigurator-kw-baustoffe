# Phase 6 – Security-Hardening Abgeschlossen

## Build-Status

**`pnpm build` — GRÜN ✓** — 0 TypeScript-Fehler

## Behobene Blocker

| # | Blocker | Fix | Datei |
|---|---|---|---|
| 1 | postMessage-Origin `"*"` | ALLOWED_ORIGINS-Whitelist, getTargetOrigin() | `src/hooks/useIframeResize.ts` |
| 2 | Rate-Limiting fehlt | In-Memory Sliding Window, 3 Req/Std/IP | `src/lib/security/rate-limit.ts` |
| 3 | hCaptcha fehlt | @hcaptcha/react-hcaptcha + Server-Verify | `src/lib/security/captcha.ts` |
| 4 | CSP + X-Frame-Options | Middleware setzt alle Header | `src/middleware.ts` |
| 5 | Input-Sanitization | Strikte Zod-Schemas + escapeHtml() | `src/app/api/submit/route.ts` |
| 6 | Honeypot | Unsichtbares `website`-Feld, silent reject | `src/components/configurator/SubmitSummary.tsx` |
| 7 | CI fehlt | GitHub Actions Workflow | `.github/workflows/ci.yml` |

## Geänderte / neue Dateien

| Datei | Änderung |
|---|---|
| `src/hooks/useIframeResize.ts` | ALLOWED_ORIGINS, getTargetOrigin(), Origin-Validation eingehender Messages |
| `src/lib/security/rate-limit.ts` | **NEU** — In-Memory Sliding Window Rate-Limiter |
| `src/lib/security/captcha.ts` | **NEU** — hCaptcha Server-Verification |
| `src/middleware.ts` | Komplett überarbeitet: Auth + CSP + X-Frame-Options + alle Security-Header |
| `src/app/api/submit/route.ts` | Rate-Limit + Captcha + Honeypot + strikte Schemas + escapeHtml() |
| `src/components/configurator/SubmitSummary.tsx` | hCaptcha-Widget + Honeypot-Feld |
| `.github/workflows/ci.yml` | **NEU** — CI: validate + vitest + data-tests + build |
| `app/vitest.config.ts` | pool: "forks", maxConcurrency: 1 (weniger RAM) |
| `app/.env.example` | HCAPTCHA_SECRET + NEXT_PUBLIC_HCAPTCHA_SITE_KEY + Upstash-Kommentare |
| `docs/SECURITY.md` | Vollständig aktualisiert mit allen Phase-6-Maßnahmen |

## Security-Architektur (Defense in Depth)

```
Request → Rate-Limit (IP) → Honeypot-Check → Captcha-Verify → Zod-Schema → Handler
```

- **Layer 1:** Rate-Limit — 3 Req/Std/IP, HTTP 429 bei Überschreitung
- **Layer 2:** Honeypot — Silent reject wenn `website`-Feld ausgefüllt
- **Layer 3:** hCaptcha — Server-seitige Token-Verifikation, HTTP 403 bei Fehler
- **Layer 4:** Zod — Strikte Typen, Längen, Regex, HTML-Escape im E-Mail-Template
- **Layer 5:** CSP + X-Frame-Options — XSS + Clickjacking-Schutz via Middleware

## Env-Variablen für Vercel (Dima einzutragen)

| Variable | Pflicht | Wo holen |
|---|---|---|
| `RESEND_API_KEY` | ✅ | https://resend.com/api-keys |
| `HCAPTCHA_SECRET` | ✅ | https://dashboard.hcaptcha.com |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | ✅ | https://dashboard.hcaptcha.com |
| `APP_PASSWORD` | ✅ | Frei wählen (Staging-Schutz) |
| `SALES_EMAIL` | empfohlen | vertrieb@kw-baustoffe.de |
| `FROM_EMAIL` | empfohlen | konfigurator@kw-baustoffe.de |

## Security-Header-Prüfung

Nach Deploy: https://securityheaders.com aufrufen → Ziel: **Grade A**

Erwartete Header:
- ✅ Content-Security-Policy
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy
- ✅ Permissions-Policy

## CI-Pipeline

GitHub Actions läuft automatisch bei Push auf `main` und Pull Requests:
1. `node scripts/validate-manufacturers.mjs`
2. `pnpm vitest run`
3. `pnpm tsx tests/parallel.spec.ts`
4. `pnpm build`

## Offene Punkte für Phase 7

- `unsafe-inline` + `unsafe-eval` in CSP schärfen (Nonce-Implementierung)
- Sentry Error-Tracking
- Upstash Redis wenn Multi-Region

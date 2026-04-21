# Captcha Provider System

Captcha-Verifikation läuft serverseitig im WordPress-Plugin `kw-pv-tools`
(siehe `wordpress-plugin/kw-pv-tools/includes/core/class-captcha.php`).

## Aktive Provider

| ID | Library | Extern? | PHP-Verify |
|---|---|---|---|
| `altcha` (Default) | `altcha` (MIT), PoW | Nein (self-hosted HMAC) | `altcha-org/altcha` |
| `none` | — | — | immer `success: true` |

Der Provider wird im WP-Admin unter **Einstellungen → KW PV Tools → Captcha**
gewählt. `none` ist ausschließlich für interne Testsysteme gedacht.

## Architektur

```
GET  /wp-json/kw-pv-tools/v1/captcha/config             → { provider, challengeUrl? }
GET  /wp-json/kw-pv-tools/v1/captcha/altcha/challenge   → Altcha PoW-Challenge
POST /wp-json/kw-pv-tools/v1/submit                     → Captcha::verify() + Replay-Schutz

Client: <CaptchaWidget onVerify={…} /> fragt /captcha/config,
        rendert AltchaWidget oder NoCaptchaWidget.
```

## Entfernt in Batch A (v2.2.0)

hCaptcha und reCAPTCHA v3 wurden aus dem Plugin entfernt:

- Beide sind externe Dienste mit Datenschutz-Implikationen (DSGVO-Aufwand, Tracking).
- Beide wären ohne CSP-Whitelisting ihrer Origins nicht lauffähig gewesen — die Default-CSP erlaubt nur `'self'` für `script-src`/`connect-src`/`frame-src`.
- Beide waren im Repo nicht getestet; der Admin-Dropdown bot sie als "funktionierende" Option an, was in Produktion zu einer stillen Kaputt-Konfiguration geführt hätte.

Siehe `docs/DECISIONS.md`, ADR-004 (Historisch) und ADR-008 (Altcha als alleiniger Provider).

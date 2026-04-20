# Captcha Provider System

Swappable captcha via `CAPTCHA_PROVIDER` env variable. Default: `altcha`.

## Providers

| ID | Library | External? | Phase 10 PHP |
|---|---|---|---|
| `altcha` | altcha-lib (MIT) | No | altcha-org/altcha |
| `hcaptcha` | @hcaptcha/react-hcaptcha | hcaptcha.com | native |
| `recaptcha` | react-google-recaptcha-v3 | google.com | native |
| `none` | — | No | always pass |

## Configuration

```env
CAPTCHA_PROVIDER=altcha           # or hcaptcha / recaptcha / none
ALTCHA_HMAC_KEY=<openssl rand -hex 32>

# hCaptcha
# HCAPTCHA_SECRET=0x...
# NEXT_PUBLIC_HCAPTCHA_SITE_KEY=...

# reCAPTCHA v3
# RECAPTCHA_SECRET_KEY=6Lc...
# NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...
```

## Architecture

```
/api/captcha/config          → returns PublicCaptchaConfig (provider + siteKey/challengeUrl)
/api/captcha/altcha/challenge → returns Altcha challenge for widget
/api/submit                  → calls getActiveCaptchaProvider().verify(token)

Client: <CaptchaWidget onVerify={...} />  fetches /api/captcha/config, renders correct widget
```

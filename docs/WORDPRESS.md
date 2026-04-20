# WordPress-Native Architektur

## Überblick

Ab Phase 10 wird der Konfigurator als WordPress-Plugin (`kw-pv-tools`) betrieben.
Die Next.js-App wird als **Static Export** gebaut und vom Plugin ausgeliefert.

```
┌───────────────────────────────────────────────────────┐
│ www.kw-baustoffe.de/pv-konfigurator/                 │
│                                                       │
│ [kw_pv_konfigurator] – Shortcode oder Gutenberg-Block │
│                                                       │
│ <script>window.KW_PV_TOOLS = { apiBase, nonce }</script>
│ <link rel="stylesheet" href=".../_next/static/...">   │
│ [pre-rendered React HTML]                             │
│ <script src=".../_next/static/..." defer></script>    │
└───────────────────────────────┬──────────────────────┘
                                │ fetch()
                                ▼
               ┌───────────────────────────────────┐
               │ PHP REST-API /wp-json/kw-pv-tools/v1 │
               │                                   │
               │ GET  /captcha/config              │
               │ GET  /captcha/altcha/challenge    │
               │ POST /submit                      │
               │                                   │
               │ → Rate-Limit (WP-Transients)     │
               │ → Honeypot                        │
               │ → Captcha-Verify (PHP)            │
               │ → wp_mail()                       │
               └───────────────────────────────────┘
```

## Plugin-Struktur

```
wordpress-plugin/kw-pv-tools/
├── kw-pv-tools.php                 # Plugin-Hauptdatei
├── uninstall.php                   # Aufräumen bei Deinstallation
├── composer.json                   # altcha-org/altcha
├── vendor/                         # Composer-Dependencies (gitignored)
│
├── includes/
│   ├── core/
│   │   ├── class-plugin.php        # Bootstrap (Singleton)
│   │   ├── class-settings.php      # WP-Options-Wrapper
│   │   ├── class-rest-api.php      # REST-Routen-Registrierung
│   │   ├── class-rate-limit.php    # IP-Limiter via WP-Transients
│   │   ├── class-captcha.php       # Altcha/hCaptcha/reCAPTCHA
│   │   ├── class-mailer.php        # wp_mail()-Wrapper
│   │   ├── class-assets.php        # React-Bundle-Loading
│   │   ├── class-admin.php         # Admin-Einstellungsseite
│   │   └── class-event-bus.php     # JS Event-Bus (Phase 11)
│   │
│   ├── konfigurator/
│   │   ├── class-konfigurator.php  # Modul-Koordinator
│   │   ├── class-shortcode.php     # [kw_pv_konfigurator]
│   │   ├── class-block.php         # Gutenberg-Block
│   │   └── class-submit-handler.php
│   │
│   └── solarrechner/
│       └── README.md               # Platzhalter (Phase 11)
│
├── assets/
│   ├── konfigurator/               # ← Static Export landet hier
│   ├── shared/js/event-bus.js      # Event-Bus
│   └── solarrechner/               # (Phase 11)
│
└── build/
    ├── sync-konfigurator.sh        # Build + Sync
    └── package.sh                  # ZIP erzeugen
```

## Deployment-Workflow

```bash
# 1. Static Export bauen und ins Plugin synchronisieren
./wordpress-plugin/build/sync-konfigurator.sh

# 2. Plugin-ZIP erzeugen (inkl. Composer-Dependencies)
./wordpress-plugin/build/package.sh
# → wordpress-plugin/builds/kw-pv-tools-v1.0.0.zip

# 3. In WordPress hochladen
# WP-Admin → Plugins → Neu hinzufügen → Plugin hochladen → ZIP wählen
```

## REST-API Endpunkte

| Methode | Pfad | Beschreibung |
|---|---|---|
| `GET` | `/wp-json/kw-pv-tools/v1/captcha/config` | Aktiven Provider + Config |
| `GET` | `/wp-json/kw-pv-tools/v1/captcha/altcha/challenge` | Altcha PoW-Challenge |
| `POST` | `/wp-json/kw-pv-tools/v1/submit` | Konfiguration einreichen |

## Shortcode-Verwendung

```
[kw_pv_konfigurator]
[kw_pv_konfigurator manufacturer="solax" route="embed"]
[kw_pv_konfigurator preset_kwp="10" preset_battery="10"]
```

## Einstellungen (WP-Admin)

WP-Admin → Einstellungen → KW PV Tools

- Vertriebs-E-Mail, Absender-E-Mail
- Captcha-Provider (Altcha / hCaptcha / reCAPTCHA / keins)
- Altcha HMAC-Key, Komplexität
- Rate-Limit (Submits/Stunde/IP)
- Standard-Sprache

## Empfehlung: WP Mail SMTP

Für zuverlässigen E-Mail-Versand WP Mail SMTP Plugin installieren und
über echten SMTP-Server (z.B. Resend SMTP, IONOS, Strato) konfigurieren.

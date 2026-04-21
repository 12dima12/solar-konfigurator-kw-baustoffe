# Phase 10 – WordPress-Plugin `kw-pv-tools` Abgeschlossen

## Plugin-Struktur

```
wordpress-plugin/kw-pv-tools/
├── kw-pv-tools.php                  ✓ Plugin-Hauptdatei (v1.0.0)
├── uninstall.php                    ✓ Aufräumen bei Deinstallation
├── composer.json                    ✓ altcha-org/altcha
│
├── includes/core/
│   ├── class-plugin.php             ✓ Bootstrap Singleton
│   ├── class-settings.php           ✓ WP-Options-Wrapper
│   ├── class-rest-api.php           ✓ REST-Routen /wp-json/kw-pv-tools/v1/*
│   ├── class-rate-limit.php         ✓ IP-Limiter via WP-Transients
│   ├── class-captcha.php            ✓ Altcha/hCaptcha/reCAPTCHA/none
│   ├── class-mailer.php             ✓ wp_mail()-Wrapper
│   ├── class-assets.php             ✓ React-Bundle-Loading + rewrite_asset_uri
│   ├── class-admin.php              ✓ Admin-Einstellungsseite
│   └── class-event-bus.php          ✓ JS Event-Bus (Phase 11 vorbereitet)
│
├── includes/konfigurator/
│   ├── class-konfigurator.php       ✓ Modul-Koordinator
│   ├── class-shortcode.php          ✓ [kw_pv_konfigurator]
│   ├── class-block.php              ✓ Gutenberg-Block
│   └── class-submit-handler.php     ✓ Rate-Limit → Honeypot → Captcha → wp_mail
│
├── includes/solarrechner/README.md  ✓ Platzhalter Phase 11
│
├── assets/konfigurator/             ← Static Export (via sync-konfigurator.sh)
├── assets/shared/js/event-bus.js    ✓ KW_PV_TOOLS_EVENT_BUS
└── assets/shared/css/frontend.css   ✓ Basis-Styles
```

## REST-API Endpunkte

| Methode | Pfad | Handler |
|---|---|---|
| `GET` | `/wp-json/kw-pv-tools/v1/captcha/config` | `Captcha::rest_get_config` |
| `GET` | `/wp-json/kw-pv-tools/v1/captcha/altcha/challenge` | `Captcha::rest_get_altcha_challenge` |
| `POST` | `/wp-json/kw-pv-tools/v1/submit` | `SubmitHandler::handle` |

## ZIP-Größe

**kw-pv-tools-v1.0.0.zip — 1,3 MB** (inkl. Static Export + Produktbilder)

## Installations-Anleitung für Dima (5 Schritte)

1. **Bundle bauen:**
   ```bash
   # Im Repo-Root
   ./wordpress-plugin/build/sync-konfigurator.sh
   ./wordpress-plugin/build/package.sh
   # → wordpress-plugin/builds/kw-pv-tools-v1.0.0.zip
   ```

2. **Plugin hochladen:**
   WP-Admin → Plugins → Neu hinzufügen → Plugin hochladen → ZIP wählen → Installieren

3. **Plugin aktivieren:**
   Plugins-Liste → KW PV Tools → Aktivieren

4. **Einstellungen konfigurieren:**
   WP-Admin → Einstellungen → KW PV Tools
   - Vertriebs-E-Mail: `vertrieb@kw-baustoffe.de`
   - Absender-E-Mail: `konfigurator@kw-baustoffe.de`
   - Captcha: Altcha (Standard, HMAC-Key wird automatisch generiert)
   - WP Mail SMTP installieren für zuverlässigen E-Mail-Versand

5. **Seite einrichten:**
   Neue WordPress-Seite → URL: `/pv-konfigurator/` → Shortcode einfügen:
   ```
   [kw_pv_konfigurator]
   ```

## Event-Bus-Contract (für Phase 11)

```javascript
// Solarrechner feuert:
KW_PV_TOOLS_EVENT_BUS.emit('recommendation', {
  kWp: 10, batteryKwh: 10, source: 'solarrechner'
});

// Konfigurator hört:
KW_PV_TOOLS_EVENT_BUS.on('recommendation', function(e) {
  // Preset in Konfigurator setzen
});
```

Debug-Modus: `localStorage.setItem('kw-pv-tools:debug', '1')`

## Bekannte Einschränkungen

- **Altcha-PHP-Library:** Muss via Composer installiert werden. Falls kein Composer verfügbar:
  Captcha-Provider auf "none" setzen oder manuell vendor/ hochladen.
- **E-Mail-Versand:** WP Mail SMTP Plugin empfohlen — PHP-eigener `mail()` ist unzuverlässig.
- **CSS-Scope:** Tailwind CSS des Konfigurators kann mit Theme-Styles kollidieren.
  Falls Probleme: `isolation: isolate` auf `.kw-pv-konfigurator-container` setzen.

## Nächster Schritt: Phase 11 (Solarrechner-Integration)

Der bestehende Solarrechner (dieses Repo, `/root/solarrechner`) wird per Event-Bus
in das Plugin eingebunden. Shortcode `[kw_solarrechner]` auf derselben Seite wie
`[kw_pv_konfigurator]` → automatische Verbindung via `kw-pv-tools:recommendation`.

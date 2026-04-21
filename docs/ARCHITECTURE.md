# Architektur

Stand: v2.4.0 (Batch D).

## System auf einen Blick

```
                   Browser
                      │
                      ▼
┌────────────────────────────────────────────────────────────┐
│                  WordPress (kw-baustoffe.de)              │
│                                                            │
│   ┌────────────────────────────────────────────────────┐   │
│   │  Frontend — Shortcode [kw_pv_konfigurator]         │   │
│   │  ── serves ──                                       │   │
│   │  • pre-rendered React body (from Next.js export)   │   │
│   │  • <script src> und <link rel=stylesheet>          │   │
│   │    aus wp-content/plugins/kw-pv-tools/             │   │
│   │    assets/konfigurator/                             │   │
│   │  • init.js liest bootstrap data-* → window.KW_PV_TOOLS │
│   │  • event-bus.js für Phase-11-Tools                  │   │
│   └────────────────────────────────────────────────────┘   │
│                                                            │
│                        fetch()                             │
│                          │                                 │
│   ┌──────────────────────▼───────────────────────────────┐ │
│   │  REST-API /wp-json/kw-pv-tools/v1/*                   │ │
│   │  ── Pipeline pro POST /submit: ──                    │ │
│   │    1. submit_permission    (Origin/Referer, B1)      │ │
│   │    2. get_json_params                                 │ │
│   │    3. Honeypot silent-accept                          │ │
│   │    4. RateLimit::check      (atomic SELECT…FOR UPDATE)│ │
│   │    5. validate              (length-caps, B4)         │ │
│   │    6. Captcha::verify       (Altcha HMAC + replay)    │ │
│   │    7. TicketId::generate    (per-year counter, B3)    │ │
│   │    8. SubmissionsLog::save  (CPT kw_pv_submission)    │ │
│   │    9. Mailer::send          (wp_mail + SMTP plugin)   │ │
│   └───────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────┘
```

Zwei Welten, die klar getrennt sind:

- **Frontend (`app/`)** — reines Static-Bundle, Next.js 16 + React 19.
  `pnpm build` erzeugt `out/`, keine Laufzeit-Node-Abhängigkeit nötig.
  State lokal in Zustand, i18n hand-rolled (ADR-006), Captcha-Widget
  via `altcha` npm-Paket (dynamisch geladen).
- **Backend (`wordpress-plugin/kw-pv-tools/`)** — PHP-Plugin, rendert
  den Shortcode, bedient die REST-Endpunkte, handhabt E-Mail und
  Admin-UI. **Keine Node-Runtime im Produktivbetrieb.**

---

## Plugin-Layout (PHP)

```
wordpress-plugin/kw-pv-tools/
├── kw-pv-tools.php                  Plugin-Header, Bootstrap, Auto-Update-Filter (C2)
├── uninstall.php                    DSGVO-gerechter Vollständig-Cleanup (C1)
├── composer.json / composer.lock    altcha-org/altcha, plugin-update-checker
├── assets/
│   ├── konfigurator/                Von sync-konfigurator.sh befüllt (gitignored)
│   │   ├── kw-pv-tools-manifest.json  Generiert von scripts/post-export.mjs
│   │   ├── solax/configurator/index.html
│   │   ├── solax/embed/index.html
│   │   ├── _next/static/…
│   │   └── kw-logo.svg, favicon.ico, products/…
│   └── shared/js/                   Plugin-eigenes JS (event-bus, init)
└── includes/
    ├── core/
    │   ├── class-plugin.php          Singleton-Boot
    │   ├── class-settings.php        wp_option-Wrapper
    │   ├── class-rest-api.php        Routen-Registrierung + submit_permission (B1)
    │   ├── class-rate-limit.php      atomarer Zähler, DB-FOR UPDATE (B1)
    │   ├── class-captcha.php         Altcha + 'none', mit Replay-Schutz
    │   ├── class-ticket-id.php       KW-PV-YYYY-NNNNN (B3)
    │   ├── class-submissions-log.php CPT + GDPR-Exporter/Eraser
    │   ├── class-mailer.php          wp_mail-Wrapper
    │   ├── class-assets.php          DOMDocument-Extraktor (D1)
    │   ├── class-csp.php             send_headers-Hook
    │   ├── class-admin.php           Einstellungs-Seite
    │   ├── class-system-check.php    Health-Dashboard
    │   ├── class-mail-preview.php    iframe-Preview-Seite
    │   ├── class-test-mail.php       "Test-E-Mail senden"
    │   ├── class-dependency-check.php WP Mail SMTP-Hinweis
    │   └── class-event-bus.php       Enqueue-Hook für shared/js
    └── konfigurator/
        ├── class-konfigurator.php    Modul-Aggregator
        ├── class-shortcode.php       [kw_pv_konfigurator]
        ├── class-block.php           Gutenberg-Block, delegiert an Shortcode
        └── class-submit-handler.php  /submit-Callback
```

---

## Frontend-Layout (Next.js Static Export)

```
app/src/
├── app/
│   ├── page.tsx                     Redirect → /solax/configurator bei 1 Hersteller
│   ├── [manufacturer]/configurator/page.tsx
│   ├── [manufacturer]/embed/page.tsx      iframe-freundlich, ohne Header
│   └── embed/page.tsx                Legacy-Redirect auf /solax/embed
├── components/
│   ├── configurator/                 ConfiguratorShell, SubmitSummary, …
│   └── ui/                           shadcn-generiert (Button, Card, Dialog, …)
├── lib/
│   ├── manufacturer-context.tsx      React-Context aus meta + catalog
│   ├── navigation.ts                 Tree-Walker über den Katalog
│   ├── stock.ts                      Verfügbarkeits-Label
│   └── captcha/client/               Altcha + 'none' Widgets (hCaptcha/reCAPTCHA in ADR-013 entfernt)
├── manufacturers/
│   ├── index.ts                      Registry
│   ├── rules-registry.ts             Client-seitige Slug→Rules-Map (siehe ADR-007)
│   └── solax/
│       ├── meta.ts                   slug, displayName, defaultLang, …
│       ├── catalog.json              ~48 Produkte, 4 Phasen, 3 Sprachen
│       └── rules.ts                  Hersteller-spezifische Filter-Logik
├── config/api.ts                     KW_PV_TOOLS-Window-Objekt-Reader
├── hooks/                            useConfigState, useIframeResize
├── store/configStore.ts              Zustand (persistiert in localStorage)
└── messages/{de,en,cs}.json          i18n-Strings
```

---

## Build- und Deploy-Pipeline

```
lokal ODER CI:
  pnpm build
    ├─ scripts/validate-manufacturers.mjs   prebuild check
    ├─ next build    (output: "export" → app/out/)
    └─ scripts/post-export.mjs              kw-pv-tools-manifest.json

  ./wordpress-plugin/build/sync-konfigurator.sh
    └─ rsync app/out/ → wordpress-plugin/kw-pv-tools/assets/konfigurator/

  ./wordpress-plugin/build/package.sh
    ├─ composer install --no-dev
    └─ zip → wordpress-plugin/builds/kw-pv-tools-v<VERSION>.zip

CI auf push/PR (.github/workflows/ci.yml):
  test        — Next.js vitest + build
  php-compat  — PHP-7.4-Lint + PHPCompatibility-Scan (the gate from fix/ci-php74-compat)
  plugin-build — beides zusammen, ZIP als Actions-Artifact (C3)
  release     — nur auf refs/tags/v*: GitHub Release mit Auto-Notes + ZIP (C3)

Deploy auf Produktion:
  - Plugin-Update-Checker prüft GitHub-Releases.
  - Admin klickt "Aktualisieren" (Auto-Update-Install ist per Filter blockiert, ADR-014).
```

---

## Datenfluss bei einem Submit

1. **Render-Zeit**: Der Shortcode rendert die pre-gebaute React-HTML im WP-Kontext; `init.js` setzt `window.KW_PV_TOOLS = { apiBase, nonce, lang, privacyUrl, version }`.
2. **User-Interaktion**: Zustand persistiert Auswahl in `localStorage`. Kein Server-Roundtrip bis zum Submit.
3. **Submit**: `SubmitSummary` baut den JSON-Payload und schickt `fetch(POST /wp-json/kw-pv-tools/v1/submit, { headers: X-WP-Nonce, signal: AbortController-10s })`.
4. **Backend-Pipeline**: (Reihenfolge gemäß oberem Diagramm) — origin/referer-Check, body-parse, honeypot, rate-limit, zod-analog-validate, captcha-verify, ticket-id, save, mail.
5. **Antwort**: `{ success: true, id: "KW-PV-2026-00042", mail_status?: "notification_failed" }`. Frontend zeigt Success-Screen (Mail ist im Log gespeichert, auch wenn der Mailer fehlgeschlagen ist — kein 500).

---

## Server/Client-Grenze (ADR-007)

`Manufacturer`-Objekte enthalten `rules`-Funktionen. React Server Components (ob Next.js-SSG oder statische Seiten) serialisieren JSON und können keine Funktions-Closures über die Wire geben. Lösung: Der `ManufacturerProvider` bekommt nur `{ meta, catalog }`, und die Client-seitige `rules-registry.ts` mappt den Slug auf die Funktionen, die im Client-Bundle kompiliert sind.

---

## Security-Architektur

Details in `docs/SECURITY.md`. Kernpunkte:

- **CSP**: `script-src 'self'` + optionale Hashes (`class-csp.php::SCRIPT_HASHES`). Kein `unsafe-inline`, kein `strict-dynamic` (Letzteres hätte das Bundle kaputtgemacht, siehe Commit `eca38d1`).
- **Nonce vs. Origin-Check**: Öffentliche REST-Route (anonymer Submit ist der Use-Case), daher kein WP-Nonce-Gate sondern Origin-/Referer-Validation (`class-rest-api.php::submit_permission`, B1).
- **Atomarer Rate-Limit**: Per-IP-Zähler in `wp_options` mit `SELECT … FOR UPDATE` (B1) — race-frei auch unter PHP-FPM mit parallelen Workern.
- **Captcha-Replay-Schutz**: Jeder gelöste Altcha-Token wird als `kw_pv_altcha_<sha256>`-Transient markiert; zweite Verwendung → 403 `reason=replay`.
- **Trust-Boundary für Plugin-Assets**: Siehe `docs/SECURITY.md` → "Trust Boundary: Plugin-Assets-Ordner". Der Shortcode-Output ist bewusst nicht durch `esc_html()` — das würde React-Hydration zerstören.

---

## Erweiterung

- **Neuen Hersteller hinzufügen**: `docs/ADD_MANUFACTURER.md`.
- **Neues Werkzeug als Plugin-Modul**: `docs/ADD_TOOL.md`.
- **Alte Phase-DONE-Dokumente**: unter `docs/history/` archiviert, nicht mehr aktuell.

## Architektur-Entscheidungen

Siehe `docs/DECISIONS.md` — alle ADR-001 bis ADR-014 chronologisch.

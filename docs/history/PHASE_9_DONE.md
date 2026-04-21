# Phase 9 – Static Export Abgeschlossen

## Build-Status

**`pnpm build` — GRÜN ✓** — TypeScript sauber, Static Export erfolgreich

## Build-Output (`out/`)

| Datei/Ordner | Inhalt |
|---|---|
| `solax/configurator/index.html` | ✓ SolaX Konfigurator |
| `solax/embed/index.html` | ✓ SolaX iFrame-Embed |
| `index.html` | ✓ Root-Redirect |
| `404.html` | ✓ 404-Seite |
| `kw-pv-tools-manifest.json` | ✓ Manifest für WP-Plugin |
| `_next/static/` | ✓ JS/CSS-Assets |

**Größe:** 3,5 MB gesamt / 1,7 MB `_next/` (JS/CSS)

## Änderungen

| Datei | Änderung |
|---|---|
| `next.config.ts` | `output: "export"`, `images.unoptimized`, `trailingSlash` |
| `src/app/api/` | **GELÖSCHT** — Submit + Captcha wandern zu PHP in Phase 10 |
| `src/middleware.ts` | **GELÖSCHT** — Security-Header setzt WP-Plugin / Webserver |
| `src/config/api.ts` | **NEU** — zentrale API-Endpunkt-Konfiguration, `KW_PV_TOOLS` Window-Objekt |
| `src/lib/captcha/client/index.tsx` | Nutzt `route("captchaConfig")` statt `/api/captcha/config` |
| `src/components/configurator/SubmitSummary.tsx` | Nutzt `route("submit")` + `getApiHeaders()` |
| `src/lib/captcha/providers/*.ts` | Server-seitige `verify()` entfernt — läuft jetzt in PHP |
| `src/lib/captcha/index.ts` | Provider-Registry entfernt — nur noch Type-Exports |
| `scripts/post-export.mjs` | **NEU** — erzeugt `kw-pv-tools-manifest.json` nach jedem Build |
| `scripts/dev-mock-api.mjs` | **NEU** — simuliert WP-REST-Endpunkte für lokale Entwicklung |
| `package.json` | `build`-Script: `next build && node scripts/post-export.mjs` |
| `.github/workflows/ci.yml` | Static-Export-Check, server-seitige Envs entfernt |
| `docs/DEPLOY.md` | Komplett neu — beschreibt Static Export + WP-Plugin-Workflow |
| `docs/STATIC_EXPORT_LIMITATIONS.md` | **NEU** — dokumentiert Einschränkungen |
| `docs/DECISIONS.md` | ADR-010: Migration zu Static Export |
| `README.md` | Tech-Stack + Dev-Workflow aktualisiert |

## Architektur nach Phase 9

```
Build-Zeit (pnpm build):
  Next.js → out/ (HTML/CSS/JS-Bundle + Manifest)

Laufzeit (Browser ↔ WordPress):
  Browser → fetch() → WP-REST-API (/wp-json/kw-pv-tools/v1/...)
                         ↓
                    PHP-Plugin (E-Mail, Captcha, Rate-Limit)
```

## Dev-Workflow (ohne WordPress)

```bash
# Terminal 1
cd app && pnpm mock-api
# Mock-API läuft auf http://localhost:8080

# Terminal 2
NEXT_PUBLIC_API_BASE=http://localhost:8080/wp-json/kw-pv-tools/v1 pnpm dev
# Konfigurator: http://localhost:3000/solax/configurator
```

## Bekannte Einschränkungen

Vollständige Liste: `docs/STATIC_EXPORT_LIMITATIONS.md`

- Produktdaten-Updates erfordern Rebuild + Plugin-Upload
- Image Optimization deaktiviert (`unoptimized: true`)
- Keine Middleware → Security-Header Sache des Webservers

## Nächster Schritt: Phase 10

WordPress-Plugin `kw-pv-tools`:
- Shortcode `[kw_pv_konfigurator]`
- Statische Assets aus `out/` ausliefern
- REST-API Endpunkte in PHP implementieren (Submit, Captcha, Rate-Limiting)
- `wp_mail()` statt Resend
- Altcha-PHP-Library: `altcha-org/altcha`

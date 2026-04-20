# Static Export — Einschränkungen

Mit `output: 'export'` (eingeführt in Phase 9) werden einige Next.js-Features nicht unterstützt.

## Nicht mehr verfügbar

| Feature | Ersatz |
|---|---|
| **Server Components (RSC)** | Alles läuft als Client-Component |
| **API-Routes** (`/app/api/*`) | Wandern zu PHP im WordPress-Plugin (Phase 10) |
| **Middleware** | Security-Header setzt der Webserver (Apache/Nginx) |
| **Image Optimization** | `unoptimized: true` — Bilder werden 1:1 ausgeliefert |
| **Rewrites / Redirects zur Laufzeit** | Muss der Webserver übernehmen |
| **ISR (Incremental Static Regeneration)** | Alles ist statisch — Rebuild nötig bei Datenänderungen |

## Dynamische Daten

- **Produktdaten:** JSON-Imports, eingefroren im Build. Neuer Build bei Produktänderungen.
- **Benutzerdaten:** `fetch()` an das WP-Plugin zur Laufzeit.
- **Sprachen:** Client-seitige i18n — funktioniert unverändert.

## Neuen Hersteller hinzufügen

1. Neuen Hersteller-Ordner anlegen (`src/manufacturers/<slug>/`)
2. In Registry eintragen (`src/manufacturers/index.ts`)
3. `pnpm build` → neue HTML-Dateien werden automatisch generiert
4. Plugin-Neubau und Upload

## Dev vs. Produktion

| | Dev | Produktion |
|---|---|---|
| API | `node scripts/dev-mock-api.mjs` auf Port 8080 | WP-Plugin REST-API |
| API-Base | `NEXT_PUBLIC_API_BASE=http://localhost:8080/...` | `/wp-json/kw-pv-tools/v1` |
| Captcha | Altcha PoW via Mock-API | Altcha PoW via WP-Plugin |

## Größen-Budget

`pnpm build` zeigt First Load JS am Ende. Ziele:
- Gesamt-Bundle: unter 2 MB
- Pro-Hersteller-Katalog: unter 500 KB
- Falls überschritten: dynamische Imports pro Hersteller (`import('./catalog.json')`)

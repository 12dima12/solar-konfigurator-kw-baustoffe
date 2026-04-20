# Deployment-Anleitung

> **Ab Phase 9:** Die App ist ein reiner Static Export. Deployment erfolgt ausschließlich über das WordPress-Plugin `kw-pv-tools` (Phase 10). Vercel wird nicht mehr benötigt.

---

## Build erstellen

```bash
cd app
NEXT_PUBLIC_API_BASE=/wp-json/kw-pv-tools/v1 pnpm build
```

Ausgabe: `app/out/` — reines HTML/CSS/JS-Bundle.

Enthält nach dem Build:
```
out/
├── solax/configurator/index.html
├── solax/embed/index.html
├── index.html
├── 404.html
├── kw-pv-tools-manifest.json   ← Plugin liest dieses Manifest
└── _next/static/               ← JS/CSS-Assets
```

---

## Deployment via WordPress-Plugin (Produktion)

Das Plugin `kw-pv-tools` (Phase 10) übernimmt:
1. Ausliefern der statischen Assets aus `out/`
2. REST-API Endpunkte (`/wp-json/kw-pv-tools/v1/...`)
3. Security-Header (via `send_headers`-Hook)
4. Shortcode `[kw_pv_konfigurator]` zum Einbetten

Detaillierte Anleitung: Phase 10 Dokumentation.

---

## Lokale Entwicklung (ohne WordPress)

```bash
# Terminal 1: Mock-API (simuliert WP-REST-Endpunkte)
cd app
pnpm mock-api
# Läuft auf http://localhost:8080

# Terminal 2: Next.js Dev-Server
NEXT_PUBLIC_API_BASE=http://localhost:8080/wp-json/kw-pv-tools/v1 pnpm dev
# http://localhost:3000/solax/configurator
```

---

## Produktdaten aktualisieren

Produktdaten sind im Build eingefroren. Bei Änderungen:

```bash
# 1. Neue Daten generieren (im solax-rebuild/-Verzeichnis)
node analysis/generate_catalog.mjs

# 2. In App kopieren
cp analysis/catalog.json app/src/manufacturers/solax/catalog.json

# 3. Neu bauen und deployen
cd app && NEXT_PUBLIC_API_BASE=/wp-json/kw-pv-tools/v1 pnpm build
# → out/ zum Plugin-Update hochladen
```

Empfehlung: Quartalsweise oder bei SolaX-Produktänderungen.

---

## Umgebungsvariablen

| Variable | Wert | Beschreibung |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `/wp-json/kw-pv-tools/v1` | API-Basis (in Produktion Same-Origin) |

Alle serverseitigen Env-Variablen (Resend, Altcha, hCaptcha) sind jetzt Sache des WordPress-Plugins.
Konfiguration: WP-Admin → KW PV Tools → Einstellungen.

---

## Einschränkungen

Siehe `docs/STATIC_EXPORT_LIMITATIONS.md`.

# Phase 5 – Hersteller-Architektur Abgeschlossen

## Build-Status

**`pnpm build` — GRÜN ✓**

```
✓ Compiled successfully
✓ TypeScript: 0 Fehler
✓ Prebuild: 1/1 Hersteller validiert (SolaX)

Route (app)
  ○ /                              Static (redirect → /solax/configurator)
  ● /[manufacturer]/configurator   SSG → /solax/configurator
  ● /[manufacturer]/embed          SSG → /solax/embed
  ƒ /api/submit                    Dynamic
  ○ /embed                         Static (redirect → /solax/embed)
```

## Was wurde umgebaut

### Neue Struktur

| Datei | Funktion |
|---|---|
| `src/manufacturers/types.ts` | ManufacturerMeta (Zod-Schema), ManufacturerRules, Manufacturer |
| `src/manufacturers/index.ts` | Registry: getManufacturer(), listManufacturers() |
| `src/manufacturers/rules-registry.ts` | Client-seitiger slug→rules Lookup |
| `src/manufacturers/solax/meta.ts` | SolaX-Metadaten (slug, Farbe, Phasen) |
| `src/manufacturers/solax/rules.ts` | X1/X3-Backup-Filterlogik |
| `src/manufacturers/solax/catalog.json` | Produktdaten (von src/data/ verschoben) |
| `src/manufacturers/solax/index.ts` | Zusammenführung meta+catalog+rules |
| `src/manufacturers/_template/` | Vorlage für neue Hersteller (nicht compiliert) |
| `src/lib/manufacturer-context.tsx` | ManufacturerProvider + useManufacturer() |
| `src/app/[manufacturer]/configurator/page.tsx` | Dynamische Route |
| `src/app/[manufacturer]/embed/page.tsx` | Dynamische iFrame-Route |
| `scripts/validate-manufacturers.mjs` | Prebuild-Validierung |
| `docs/ARCHITECTURE.md` | Technische Architektur-Dokumentation |
| `docs/ADD_MANUFACTURER.md` | Schritt-für-Schritt-Anleitung |

### Geänderte Dateien

| Datei | Änderung |
|---|---|
| `src/app/page.tsx` | Redirect zu /solax/configurator (1 Hersteller) oder Picker (mehrere) |
| `src/app/embed/page.tsx` | Redirect zu /solax/embed |
| `src/lib/navigation.ts` | Optionaler `catalog`-Parameter statt direktem Import |
| `src/hooks/useConfigState.ts` | Optionaler `catalog`-Parameter weitergeleitet |
| `src/components/configurator/ConfiguratorShell.tsx` | Nutzt useManufacturer() |
| `src/components/configurator/PowerSlider.tsx` | Optionaler `catalog`-Parameter |
| `src/components/configurator/SubmitSummary.tsx` | Sendet manufacturer-Feld mit |
| `src/app/api/submit/route.ts` | manufacturer-Feld im Schema |
| `next.config.ts` | Redirects /embed + /configurator → /solax/... |
| `tsconfig.json` | _template ausgeschlossen |
| `package.json` | prebuild-Script |

## Technische Entscheidung: Server/Client-Grenze

Next.js erlaubt keine Funktionen von Server- zu Client-Komponenten.
Lösung: `ManufacturerProvider` erhält nur serialisierbare Daten (meta + catalog).
Rules werden client-seitig via `rules-registry.ts` anhand des Slugs aufgelöst.

## Neuen Hersteller hinzufügen

1. `cp -r src/manufacturers/_template src/manufacturers/<slug>`
2. meta.ts + catalog.json + rules.ts ausfüllen
3. In `src/manufacturers/index.ts` + `rules-registry.ts` eintragen
4. `pnpm build` — fertig

Detaillierte Anleitung: `docs/ADD_MANUFACTURER.md`

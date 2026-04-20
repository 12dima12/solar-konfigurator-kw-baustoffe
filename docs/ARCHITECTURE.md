# Konfigurator-Architektur

## Übersicht

Der KW PV Konfigurator ist eine hersteller-agnostische Next.js-Plattform. SolaX ist der erste Hersteller — weitere können ohne Code-Änderungen hinzugefügt werden.

## Verzeichnisstruktur

```
src/
├── manufacturers/
│   ├── index.ts              Registry: getManufacturer(), listManufacturers()
│   ├── types.ts              ManufacturerMeta, ManufacturerRules, Manufacturer
│   ├── rules-registry.ts     Client-seitiger Lookup: slug → rules
│   ├── solax/
│   │   ├── index.ts          Kombiniert meta + catalog + rules
│   │   ├── meta.ts           Metadaten (slug, Farbe, Phasen)
│   │   ├── catalog.json      Produktdaten (18 JSONs gebündelt)
│   │   └── rules.ts          Hersteller-spezifische Filterlogik
│   └── _template/            Vorlage für neue Hersteller (nicht compiliert)
│
├── app/
│   ├── page.tsx              Redirect zu /solax/configurator (1 Hersteller)
│   │                         oder Hersteller-Picker (mehrere)
│   └── [manufacturer]/
│       ├── configurator/page.tsx   Haupt-Konfigurator
│       └── embed/page.tsx          iFrame-Variante
│
└── lib/
    └── manufacturer-context.tsx    React Context: meta + catalog + rules
```

## Datenfluss

```
Server Component (page.tsx)
  └─ getManufacturer(slug)      → { meta, catalog, rules }
       │
       ├─ meta + catalog        → ManufacturerProvider (serialisierbar)
       │
       └─ rules                 → rules-registry.ts (Client, via slug lookup)

Client Component (ConfiguratorShell)
  └─ useManufacturer()          → { meta, catalog, rules }
       │
       ├─ catalog               → useConfigState(catalog) → navigation.ts
       └─ meta.logoUrl          → Header
```

## Server/Client-Grenze

Funktionen (rules) können nicht von Server zu Client-Komponenten übergeben werden.
Lösung: `ManufacturerProvider` erhält nur serialisierbare Daten (meta + catalog).
Rules werden client-seitig via `rules-registry.ts` anhand des Slugs aufgelöst.

## Neuen Hersteller hinzufügen

Siehe `docs/ADD_MANUFACTURER.md`.

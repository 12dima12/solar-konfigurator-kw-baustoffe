# Neuen Hersteller hinzufügen

Checkliste um einen zweiten Hersteller (z.B. Fronius) in den Konfigurator aufzunehmen.
Geschätzter Aufwand: 2–4 Stunden je nach Datenlage.

## Schritt 1: Verzeichnis anlegen

```bash
cp -r src/manufacturers/_template src/manufacturers/fronius
```

## Schritt 2: Metadaten ausfüllen

`src/manufacturers/fronius/meta.ts`:

```ts
const meta: ManufacturerMeta = {
  slug: "fronius",
  displayName: "Fronius",
  accentColor: "#e2001a",   // Fronius-Rot
  logoUrl: "/kw-logo.svg",  // oder eigenes Logo nach /public/
  supportedPhases: ["inverter", "backup", "battery", "wallbox"],
  defaultLang: "de",
};
```

## Schritt 3: Katalogdaten erstellen

Katalogformat: wie `src/manufacturers/solax/catalog.json`.

Wichtig:
- Top-Level-Keys = Phasen (`inverter`, `backup`, etc.)
- Je Phase: `{ de: { tree: {...} }, en: {...}, cs: {...} }`
- `tree` = rekursiver Objektbaum mit `ConfigNode`-Einträgen

Minimales Beispiel in `src/manufacturers/_template/catalog.example.json`.

## Schritt 4: Einstiegsdatei erstellen

`src/manufacturers/fronius/index.ts`:

```ts
import type { Manufacturer } from "../types";
import meta from "./meta";
import rules from "./rules";
import catalog from "./catalog.json";

const fronius: Manufacturer = { meta, catalog: catalog as Record<string, unknown>, rules };
export default fronius;
```

## Schritt 5: Rules anpassen (optional)

`src/manufacturers/fronius/rules.ts` — nur überschreiben was nötig ist:

```ts
const rules: ManufacturerRules = {
  filterOptions: (_phase, _lang, options) => options,  // kein Filter
  validateCombination: (_selections) => ({ valid: true }),
};
```

## Schritt 6: In Registry eintragen

`src/manufacturers/index.ts`:

```ts
import fronius from "./fronius";

const MANUFACTURERS: Record<string, Manufacturer> = {
  solax,
  fronius,   // ← hinzufügen
};
```

`src/manufacturers/rules-registry.ts`:

```ts
import froniusRules from "./fronius/rules";

const RULES: Record<string, ManufacturerRules> = {
  solax: solaxRules,
  fronius: froniusRules,   // ← hinzufügen
};
```

## Schritt 7: Build

```bash
pnpm build
```

Der Prebuild-Check validiert automatisch alle Hersteller-Metadaten.
Bei Erfolg: neue Route `/fronius/configurator` ist aktiv.

## Ergebnis

- `/fronius/configurator` — Konfigurator mit Fronius-Daten
- `/fronius/embed` — iFrame-Variante
- Die Startseite zeigt automatisch einen Hersteller-Picker wenn mehr als 1 Hersteller registriert ist

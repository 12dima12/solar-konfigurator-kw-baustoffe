# Neuen Hersteller hinzufügen

1. Dieses `_template/`-Verzeichnis nach `src/manufacturers/<slug>/` kopieren
2. `meta.ts` ausfüllen (slug, displayName, accentColor, logoUrl, supportedPhases)
3. `catalog.example.json` durch das echte `catalog.json` ersetzen (Format: siehe SolaX)
4. `rules.ts` anpassen — filterOptions / validateCombination nach Bedarf
5. `index.ts` erstellen (wie bei solax/index.ts)
6. In `src/manufacturers/index.ts` den neuen Import eintragen
7. `pnpm build` — der Prebuild-Check validiert die Metadaten automatisch

Fertig. Kein weiterer Code notwendig.

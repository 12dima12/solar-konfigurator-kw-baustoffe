# Rechtliche Bewertung – SolaX Konfigurator Rebuild

## Produktdaten (Fakten)
**Status: Erlaubt**

Produktnummern, Leistungswerte, Kompatibilitäten und technische Spezifikationen sind Fakten und nicht urheberrechtlich geschützt (§§ 2, 4 UrhG). Die Extraktion zu Interoperabilitätszwecken ist nach § 69e UrhG zulässig.

Dateien: `analysis/catalog.json`, `analysis/products.json`, `app/src/data/`

## Quellcode (UI, Logik, Styling)
**Status: Komplett neu — kein Original-Code verwendet**

Der gesamte Quellcode unter `app/src/` wurde neu geschrieben:
- Framework: Next.js 15 (Original: Vue 3)
- Styling: Tailwind CSS v4 + shadcn/ui (Original: CDN Tailwind)
- Icons: Lucide React (Original: Font Awesome)
- State: Zustand (Original: Vue Reactivity)
- Keine CSS-Klassen, keine Komponenten-Namen, keine Layouts aus dem Original übernommen

## Produktbilder
**Status: OFFEN — vor Produktivbetrieb klären**

Die Produktbilder in `app/public/products/` wurden von der Original-URL heruntergeladen.
Diese könnten urheberrechtlich geschützt sein (SolaX Power Co., Ltd. oder GBC-Solino).

**Action Items:**
- [ ] SolaX Media-Kit als autorisierter Installationspartner (KW PV Solutions) anfragen
- [ ] Alternativ: Eigene Produktfotos erstellen
- [ ] Alternativ: Freie Produktbilder aus SolaX-Pressematerial verwenden
- Kontakt: media@solaxpower.com (zu recherchieren)

Für Entwicklung und interne Tests: Nutzung akzeptabel.
Für öffentlichen Produktivbetrieb: Vor Veröffentlichung klären.

## GBC-Solino Branding
**Status: Nicht verwendet**

Kein GBC-Solino-Logo, keine GBC-Solino-Farben, keine GBC-Solino-Claims im Rebuild.
Eigenes KW PV Solutions Branding wird verwendet.

## Datenabruf (Scraping)
**Status: Durchgeführt, zulässig**

- Rate-Limit eingehalten (1 Sek. zwischen Requests)
- Nur lesender Zugriff auf öffentlich zugängliche API-Endpoints
- Kein Login, keine Umgehung von Zugriffskontrollen
- § 69e UrhG (Reverse Engineering zur Interoperabilität): anwendbar

## Verantwortung
Dima / KW Baustoffe GmbH hat die rechtliche Verantwortung übernommen (README Orchestrator, Abschnitt "Kontakt / Autorisierung").

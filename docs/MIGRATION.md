# Migration – Was wurde übernommen vs. neu gebaut

## Übernommen (Daten / Fakten)

| Was | Quelle | Rechtlich |
|---|---|---|
| Produktnummern (z.B. G-21s-6304) | API-Endpoint | Fakten, frei |
| Produktnamen (z.B. "Solax G4 X1-Hybrid-3.0-D") | API-Endpoint | Fakten, frei |
| Leistungswerte (kW) | API-Endpoint | Fakten, frei |
| Lagerbestände (totalAvailable/totalOrdered) | API-Endpoint | Fakten, frei |
| Produktbilder | `/img/*.png` | OFFEN (siehe LEGAL.md) |
| Konfigurations-Reihenfolge (inverter→backup→battery→wallbox) | API (configuratorNext) | Funktionsprinzip, frei |

## Neu gebaut (alles andere)

| Was | Original | Rebuild |
|---|---|---|
| Framework | Vue 3 SPA | Next.js 15 App Router |
| Styling | CDN Tailwind + eigene CSS-Klassen | Tailwind v4 + shadcn/ui |
| Icons | Font Awesome 6 | Lucide React |
| State Management | Vue Reactivity API | Zustand + Persist |
| Baumnavigation | Original JS-Logik | Eigene `navigation.ts` |
| Stock-Anzeigelogik | Original Vue-Template | Eigene `stock.ts` |
| Step-Indicator | Runde Punkte auf gestrichelter Linie | Pills/Breadcrumb-Stil |
| Produktkarten | Original Card-Komponente | Eigene `OptionCard.tsx` |
| Power-Slider | Custom Vue-Slider | shadcn/ui Slider |
| Sidebar | Absolut positionierte Sidebar | shadcn/ui Sheet (Drawer) |
| Sprach-Routing | URL-Parameter | Next.js i18n + Zustand |
| Submit-Endpoint | Unbekannter PHP-Backend | Next.js API Route |
| PDF-Export | Nicht vorhanden | @react-pdf/renderer (Phase 4) |
| iFrame-Resize | postMessage (Original unbekannt) | Eigener `useIframeResize.ts` mit `kw-configurator-resize` Namespace |
| Branding | GBC-Solino (Gelb/Weiß) | KW PV Solutions (Dunkelblau/Rot) |
| Domains/Logos | GBC-Solino | KW PV Solutions |

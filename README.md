# KW PV Solutions – Hersteller-Konfigurator

Web-basierter Produktkonfigurator für PV-Anlagen. Kunden wählen Schritt für Schritt Wechselrichter, Batterie, Wallbox und Zubehör – am Ende wird die Konfiguration als HTML-E-Mail an den Vertrieb (`vertrieb@kw-baustoffe.de`) und an den Kunden (Bestätigung mit Ticket-Referenz) versandt.

**Aktuell integrierte Hersteller:** SolaX Power  
**Erweiterbar um:** Fronius, Huawei, GoodWe, Sungrow, … (Architektur ist Multi-Hersteller)

---

## Schnellstart

### Für Dima / KW Baustoffe
Du willst nur etwas ändern? Gehe zu **`docs/USER_MANUAL.md`**.

### Für neue Entwickler
Lies in dieser Reihenfolge:
1. **`docs/ONBOARDING.md`** – 30-Min-Einstieg
2. **`docs/ARCHITECTURE.md`** – Big Picture
3. **`docs/ADD_MANUFACTURER.md`** – Wenn du Fronius o.ä. integrieren sollst

### Für Code-Review
- **`docs/ARCHITECTURE.md`** – Gesamtarchitektur
- **`docs/SECURITY.md`** – Security-Maßnahmen
- **`docs/DECISIONS.md`** – Warum dieser Stack, warum diese Patterns

### Vor jedem Live-Deployment
- **`docs/SMOKE_TEST.md`** – Manueller End-to-End-Check (~20 Min) gegen das Docker-Compose-Environment in `wordpress-plugin/dev/`. Nicht überspringen.

---

## Tech-Stack auf einen Blick

- **Framework:** Next.js (App Router, Static Export)
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (Client-State)
- **Forms:** react-hook-form + zod
- **i18n:** 3 Sprachen (DE/EN/CS)
- **E-Mail:** wp_mail() via WordPress-Plugin (Phase 10)
- **Bot-Schutz:** Altcha (Proof-of-Work, lokal) + Honeypot + Rate-Limiting in PHP
- **Deployment:** WordPress-Plugin `kw-pv-tools` auf kw-baustoffe.de
- **Testing:** Vitest (Unit) + Node.js (Daten)

---

## Entwicklung lokal

```bash
# Terminal 1: Mock-API simuliert WordPress-REST-Endpunkte
cd app && pnpm mock-api

# Terminal 2: Next.js Dev-Server
cd app
NEXT_PUBLIC_API_BASE=http://localhost:8080/wp-json/kw-pv-tools/v1 pnpm dev
# http://localhost:3000/solax/configurator
```

## Static Export (Produktions-Build)

```bash
cd app
NEXT_PUBLIC_API_BASE=/wp-json/kw-pv-tools/v1 pnpm build
# → out/ enthält das fertige HTML/CSS/JS-Bundle + kw-pv-tools-manifest.json
```

Detaillierte Deploy-Anleitung: **`docs/DEPLOY.md`**

---

## Lizenz & Rechtliches

- Code: Proprietär, KW Baustoffe GmbH
- Produktdaten & Bilder SolaX: Lizenziert als offizieller SolaX-Händler
- Siehe **`docs/LEGAL.md`**

## Kontakt

KW Baustoffe GmbH, Drensteinfurt  
vertrieb@kw-baustoffe.de

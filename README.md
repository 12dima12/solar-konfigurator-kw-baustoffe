# KW PV Solutions – Hersteller-Konfigurator

Web-basierter Produktkonfigurator für PV-Anlagen. Kunden wählen Schritt für Schritt Wechselrichter, Batterie, Wallbox und Zubehör – am Ende erhalten sie (und unser Vertrieb) ein PDF mit der Konfiguration.

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

---

## Tech-Stack auf einen Blick

- **Framework:** Next.js 15 (App Router, RSC wo sinnvoll)
- **Language:** TypeScript strict
- **Styling:** Tailwind CSS + shadcn/ui
- **State:** Zustand (Client-State)
- **Forms:** react-hook-form + zod
- **i18n:** 3 Sprachen (DE/EN/CS)
- **E-Mail:** Resend
- **Bot-Schutz:** hCaptcha + Rate-Limiting + Honeypot
- **Deployment:** Vercel (empfohlen) oder eigener Node-Server
- **Testing:** Vitest (Unit) + Node.js (Daten) + Playwright (E2E, optional)

---

## Entwicklung lokal

```bash
cd app
cp .env.example .env.local   # Keys eintragen (siehe Kommentare)
pnpm install
pnpm dev                     # http://localhost:3000
```

## Build & Deploy

```bash
pnpm build   # validiert Hersteller-Daten + baut
pnpm start   # Produktions-Server lokal
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

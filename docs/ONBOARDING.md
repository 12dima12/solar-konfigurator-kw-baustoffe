# Onboarding für neue Entwickler

Willkommen! Dieses Dokument bringt dich in 30 Minuten auf Geschwindigkeit.

## Was macht dieses Projekt?

Ein mehrsprachiger Produktkonfigurator für PV-Anlagen. Der Kunde klickt sich durch 4–6 Schritte (Wechselrichter → Backup → Batterie → Wallbox → Zusammenfassung) und erhält ein PDF-Angebot. Das Ganze ist als iFrame auf kw-baustoffe.de eingebettet.

## Warum gibt es dieses Projekt?

Der Vertrieb hat früher manuelle Angebote gebaut (~2h je Anfrage). Mit dem Konfigurator filtert sich der Kunde selbst durch die Optionen – der Vertrieb bekommt nur qualifizierte Leads mit klarer Produktauswahl.

## Big Picture

```
Kunde → kw-baustoffe.de
         ↓ (iFrame)
    konfigurator.kw-baustoffe.de/solax/embed
         ↓
    ConfiguratorShell (React-Komponente)
         ↓ liest aus
    src/manufacturers/solax/catalog.json
         ↓ bei Submit
    /api/submit → Resend → vertrieb@kw-baustoffe.de (E-Mail mit PDF)
                         → kunde@example.com (Bestätigung)
```

## Code-Struktur in 5 Minuten

```
app/
├── src/
│   ├── app/                        ← Routen (Next.js App Router)
│   │   ├── page.tsx                Hersteller-Auswahl / Redirect
│   │   ├── [manufacturer]/         Dynamische Route pro Hersteller
│   │   │   ├── configurator/       Voll-Seite-Konfigurator
│   │   │   └── embed/              iFrame-Variante
│   │   └── api/submit/             Submit-Endpoint (Rate-Limit, Captcha, E-Mail)
│   │
│   ├── manufacturers/              ← WICHTIG: Hier lebt der Hersteller-Kram
│   │   ├── index.ts                Registry
│   │   ├── solax/                  SolaX-spezifisch (nur Daten + Metadaten)
│   │   └── _template/              Vorlage für neue Hersteller
│   │
│   ├── components/configurator/    ← Generisch, nicht hersteller-spezifisch
│   │   ├── ConfiguratorShell.tsx   Haupt-Container
│   │   ├── StepIndicator.tsx       Stepper-UI
│   │   ├── OptionCard.tsx          Einzelne Produkt-Karte
│   │   └── …
│   │
│   ├── lib/                        ← Utility-Funktionen
│   │   ├── manufacturer-context.tsx  Aktiver Hersteller im React-Tree
│   │   ├── security/               Rate-Limit, Captcha-Verify
│   │   ├── navigation.ts           Baum-Navigation
│   │   └── stock.ts                Stock-Badge-Logik
│   │
│   ├── hooks/                      ← React-Hooks
│   ├── store/                      ← Zustand-Store (User-Auswahl)
│   └── data/types.ts               ← Geteilte TS-Typen
│
├── public/
│   └── products/                   ← Logos, Produktbilder
│
└── tests/
    ├── parallel.spec.ts            Daten-Tests (68 Stück)
    └── iframe-host.html            Manueller iFrame-Test
```

## Die 3 wichtigsten Konzepte

### 1. Hersteller als Daten-Plugin
Jeder Hersteller ist ein Ordner unter `src/manufacturers/`. Kein hersteller-spezifischer Code im Rest der App – alles geht über die generischen Komponenten + Daten aus dem aktiven Hersteller-Kontext.

### 2. Baum-Navigation
Produkte sind rekursiv verschachtelt: Kategorie → Typ → Leistung → Variante.  
Der User-State ist ein einfaches `steps: string[]` Array – jedes Element ist der Key im aktuellen Kinderknoten.

### 3. iFrame-Integration
Zwei Routen pro Hersteller: `/configurator` (volle Seite) und `/embed` (minimaler Chrome, ohne Header/Footer). Höhe wird via postMessage an den Parent synchronisiert.

## Setup (5 Minuten)

```bash
git clone https://github.com/12dima12/solar-konfigurator-kw-baustoffe.git
cd solar-konfigurator-kw-baustoffe/app
cp .env.example .env.local
# .env.local: HCAPTCHA_SECRET + NEXT_PUBLIC_HCAPTCHA_SITE_KEY eintragen
# Test-Keys: NEXT_PUBLIC_HCAPTCHA_SITE_KEY=10000000-ffff-ffff-ffff-000000000001
pnpm install
pnpm dev
# → http://localhost:3000 (leitet weiter zu /solax/configurator)
```

## Dein erster Task (Übung)

Als Aufwärmung: Ändere den Headline-Text auf der Hersteller-Auswahl-Seite.

1. Finde die Datei: `grep -r "Wähle" src/`
2. Ändere den Text
3. `pnpm dev` laufen lassen, Browser öffnen, Change verifizieren

## Regeln

- Keine hersteller-spezifischen Checks im Kern-Code (kein `if (slug === "solax")`)
- TypeScript strict – kein `any`, keine `@ts-ignore`
- Commits in Conventional-Commits-Format (`feat:`, `fix:`, `docs:`, `chore:`)
- Neue Features brauchen Tests
- UI-Änderungen brauchen Screenshot im PR

## Wo du Hilfe findest

- **`docs/ARCHITECTURE.md`** – Big Picture
- **`docs/ADD_MANUFACTURER.md`** – Anleitung für neuen Hersteller
- **`docs/DECISIONS.md`** – Warum wurde Lösung X gewählt, Alternativen
- **`docs/FAQ.md`** – Häufige Fragen + Antworten
- **Dima (@dima12):** Bei Produkt-/Fachfragen

# SolaX Konfigurator Rebuild – Projektabschluss

**Auftraggeber:** Dima / KW Baustoffe GmbH / KW PV Solutions UG  
**Projektziel:** Eigener, iFrame-embeddable PV-Konfigurator unter KW-Branding  
**Gesamtstatus:** Staging-ready ✓

---

## Phase 0 – Sanity Check

### Endpoint-Status
- inverter/de: HTTP 200, 53.099 bytes
- battery/de: HTTP 200, 413 bytes
- Image-Test: HTTP 200

### Ergebnis
**GRÜN** — Alle Endpoints antworten ohne Authentifizierung. Kein CSRF-Token, kein Session-Cookie, kein Rate-Limiting. 18 Requests (6 configFiles × 3 Sprachen) reichen für vollständigen Daten-Download.

### JSON-Struktur
- Rekursiver Objektbaum mit benannten Keys (kein Array)
- Top-Level-Kategorien inverter: `IES`, `Split System`
- battery: flacher `Record<string, string>`

---

## Phase 1 – Daten-Extraktion

### Ergebnis
**12 von 18 JSON-Dateien valide** — `accessory` und `finish` serverseitig leer.

### Aktive Konfiguratoren
| Konfigurator | Produkte | Baumtiefe | Sprachen |
|---|---|---|---|
| inverter | 31 | 3–4 | de/en/cs |
| backup | 6 | 2 | de/en/cs |
| battery | 3 | 1 (flat) | de/en/cs |
| wallbox | 8 | 4 | de/en/cs |

### Assets
- 20 Produktbilder lokal (17 Produkte + 2 Cover + 3 Flaggen)
- CSS (65 KB), HTML (8 KB)
- Besonderheit: benannte Objekt-Keys statt Arrays, `.value` ist Produktname

---

## Phase 2 – Datenanalyse

### Produkte gesamt
| Phase | Produkte | Besonderheit |
|---|---|---|
| inverter | 31 | X3 hat Varianten-Ebene; IES flacher |
| backup | 6 | X1/X3-Trennung nur per Produktname |
| battery | 3 | Flat map, kein product_code |
| wallbox | 8 | Anzahl → Leistung → Anschluss → Variante |
| **Gesamt** | **48** | (45 mit product_code, 3 battery-Labels) |

### Business Rules
- 9 dokumentierte Regeln (Navigation, Sortierung, Stock, Spezialfälle)
- Stock-Logik: 0+0 = rot, 0+ordered = gelb, <10 = gelb, ≥10 = grün
- > 30 kW und "More than one Wallbox": Contact-Node statt Produktauswahl
- Backup "No" / Wallbox "No Charger": Terminierungs-Node ohne Produkt

### Datenqualität
- Keine Duplikate, kein kaputtes UTF-8
- 8 Produkte mit stock=0 vollständig ausgelistet
- 0 explizite Kompatibilitäts-Constraints (X1/X3-Filterung implizit aus Produktnamen)

### Erzeugte Analyse-Dateien
`schema.md`, `types.ts`, `catalog.json`, `products.json`, `business-rules.md`, `state-machine.md`, `compatibility-matrix.md`, `data-quality.md`, `i18n/de+en+cs.json`, `OPEN_QUESTIONS.md`

---

## Phase 3 – Clean-Room-Rebuild

### Build-Status
**`pnpm build` — GRÜN ✓** — 0 TypeScript-Fehler, ~6s Compile-Zeit

```
Route (app)
  ○ /              Static
  ○ /_not-found    Static
  ƒ /api/submit    Dynamic
  ○ /embed         Static (iFrame)
```

### Tech-Stack
- Next.js 15 (App Router, TypeScript strict)
- Tailwind CSS v4 + shadcn/ui
- Zustand + localStorage-Persist
- react-hook-form + zod

### Implementierte Komponenten (10)
| Komponente | Funktion |
|---|---|
| ConfiguratorShell | Haupt-Container, Phase-Routing |
| StepIndicator | 4-Schritt Pills, erledigte Schritte zurückklickbar |
| OptionCard | Text / Icon / Image / Cover Varianten |
| OptionGrid | Responsive 1/2/3-Spalten |
| StockBadge | rot/gelb/grün nach Verfügbarkeit |
| InfoModal | HTML-Info hinter i-Button |
| PowerSlider | shadcn Slider für X3 (5–30 kW + >30 Contact) |
| CurrentSetupSidebar | shadcn Sheet/Drawer mit Auswahl-Übersicht |
| LanguageSwitcher | DE/EN/CS Dropdown |
| SubmitSummary | Produktübersicht + Kontaktformular |

### Branding
- Primary: `#1e3a5f` (KW-Dunkelblau)
- Accent: `#e63946` (KW-Rot)
- Vollständig getrennt von GBC-Solino (kein Gelb, kein Original-Logo)

---

## Phase 4 – QA, Testing & Deployment

### Tests
**68 / 68 PASS** — Node.js direkt gegen catalog.json

| Bereich | Pfade getestet |
|---|---|
| IES alle Leistungsstufen (de/en/cs) | 21 |
| Split System X1 (3 Varianten) | 9 |
| Split System X3 Hybrid G4 | 12 |
| Split System X3 Ultra | 6 |
| Backup (Yes/No, alle Produkte) | 8 |
| Wallbox (4 Pfade) | 12 |
| **Gesamt** | **68** |

Sprachkonsistenz DE = EN = CS: **0 Abweichungen**

### E-Mail-Integration
- Resend API — sendet an `vertrieb@kw-baustoffe.de` + Kunden-Bestätigung
- PDF-Anhang (A4, KW-Branding, `@react-pdf/renderer`)
- Aktivierung: `RESEND_API_KEY` in `app/.env.local`

### Erzeugte Dokumentation
| Datei | Inhalt |
|---|---|
| `docs/LEGAL.md` | Rechtsbewertung je Komponente |
| `docs/MIGRATION.md` | Original vs. Rebuild — was übernommen, was neu |
| `docs/DEPLOY.md` | Vercel + eigener Server + iFrame-Snippet |
| `docs/SECURITY.md` | Checkliste + Code-Snippets (CSP, Rate-Limit, Origin) |
| `docs/USER_MANUAL.md` | Für Dima/Vertrieb und Webmaster |
| `docs/HANDOVER.md` | Gesamt-Übergabe, Roadmap Phase 5+ |
| `tests/parallel.spec.ts` | Playwright + datenbasierte Tests |
| `tests/iframe-host.html` | iFrame-Integrationstest |
| `app/.env.example` | Umgebungsvariablen-Vorlage |

---

## Was Dima jetzt noch tun muss

### Pflicht vor Produktiv-Deployment
1. **Resend-Account** anlegen, `kw-baustoffe.de` verifizieren → https://resend.com
2. **`app/.env.local`** erstellen: `RESEND_API_KEY=re_...`
3. **Staging deployen:** `cd app && vercel`
4. **E-Mail-Flow testen:** Formular absenden, E-Mail + PDF prüfen
5. **DNS-Eintrag** für `konfigurator.kw-baustoffe.de` setzen
6. **Produktbilder-Lizenz** klären: SolaX Media-Kit als Installationspartner anfragen

### Empfohlen
7. **Backup X1/X3-Filterung** implementieren (OQ-1)
8. **postMessage-Origin** einschränken (aktuell `"*"`)
9. **Rate-Limiting** auf `/api/submit` (upstash)
10. **CSP + X-Frame-Options** in `next.config.ts`

---

## Roadmap Phase 5+

| Phase | Inhalt | Aufwand |
|---|---|---|
| 5 | Weitere Hersteller (Fronius, Huawei, GoodWe) | 2–4 Tage |
| 6 | CRM-Anbindung (Lexware / Openhandwerk) | 1–2 Tage |
| 7 | Preiskalkulation + automatische PDF-Angebote | 2–3 Tage |
| 8 | A/B-Testing UX-Varianten | 1 Tag |

---

## Projektstruktur (Endzustand)

```
solax-rebuild/
├── recon/                  # Phase 1: Rohdaten
│   ├── data/               # 18 JSON-Dateien
│   ├── img/                # 20 Produktbilder
│   ├── css/output.css
│   └── html/index.html
├── analysis/               # Phase 2: Datenmodelle
│   ├── catalog.json
│   ├── products.json
│   ├── types.ts
│   ├── business-rules.md
│   ├── state-machine.md
│   ├── compatibility-matrix.md
│   └── i18n/de+en+cs.json
├── app/                    # Phase 3+4: Next.js App
│   ├── src/components/configurator/  (10 Komponenten)
│   ├── src/lib/            (navigation, stock, pdf)
│   ├── src/store/          (configStore)
│   ├── src/app/api/submit/ (E-Mail + PDF)
│   └── public/products/    (Produktbilder)
├── tests/                  # Phase 4: Tests
│   ├── parallel.spec.ts
│   └── iframe-host.html
└── docs/                   # Phase 4: Dokumentation
    ├── LEGAL.md
    ├── MIGRATION.md
    ├── DEPLOY.md
    ├── SECURITY.md
    ├── USER_MANUAL.md
    └── HANDOVER.md
```

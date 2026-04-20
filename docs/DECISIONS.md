# Architecture Decision Records

Format: Für jede wichtige Entscheidung Kontext + was wir gewählt haben + was wir verworfen haben + warum.

---

## ADR-001: Next.js 15 statt Vite + React SPA

**Kontext:** Das Original ist eine Vue SPA mit PHP-Backend. Wir wollten einen Clean-Room-Rebuild mit modernem Stack, iFrame-Embedding, API-Routes und SSG-Fähigkeit.

**Entscheidung:** Next.js 15 App Router.

**Alternativen verworfen:**
- **Vite + React:** Kein SSR, SEO schwächer, keine nativen API-Routes
- **Astro:** Keine wirkliche Interaktivität out-of-the-box
- **Remix:** Solide, aber kleineres Ökosystem

**Konsequenzen:**
+ API-Routes integriert (kein separates Backend nötig)
+ Deployment auf Vercel trivial
+ RSC nutzbar für statische Inhalte
− Mehr Komplexität als Vite
− Bundle-Größe höher

---

## ADR-002: Zustand statt Redux/Context/Jotai

**Kontext:** User-Auswahl (steps) muss über die App-Komponenten geteilt werden. Persist zwischen Page-Reloads erwünscht.

**Entscheidung:** Zustand mit persist-Middleware.

**Alternativen verworfen:**
- **Redux Toolkit:** Overkill für diesen App-Scope
- **React Context:** Re-Rendert zu viel
- **Jotai:** Atomic State wäre stärker, aber Lernkurve höher

**Konsequenzen:**
+ Wenige Zeilen Code
+ Persist mit 3 Zeilen
+ Kein Provider-Boilerplate
− Weniger Tooling (DevTools spärlicher als Redux)

---

## ADR-003: Hersteller als Datenordner statt Datenbank

**Kontext:** Produktdaten müssen erweiterbar sein (Fronius, Huawei, …).

**Entscheidung:** Jeder Hersteller ist ein Ordner mit `catalog.json` + `meta.ts`. Build-Time-validiert. Kein CMS, keine DB.

**Alternativen verworfen:**
- **Headless CMS (Contentful, Sanity):** Overhead, Kosten, externe Abhängigkeit
- **PostgreSQL:** Overkill bei <100 Produkten, Backup-Komplexität
- **SQLite:** Build-Zeit-Inkonsistenz zwischen Dev/Prod

**Konsequenzen:**
+ Git-versioniert (Produktänderungen im Changelog sichtbar)
+ Kein Runtime-Failure bei DB-Down
+ Trivial für Entwickler nachzuvollziehen
− Updates brauchen Commit + Deploy (kein Live-Editing)
− Bei 1000+ Produkten ineffizient (derzeit 48)

---

## ADR-004: hCaptcha statt reCAPTCHA

**Kontext:** Bot-Schutz am Submit-Formular.

**Entscheidung:** hCaptcha.

**Alternativen verworfen:**
- **Google reCAPTCHA:** Tracker, DSGVO-Einwilligung nötig
- **Cloudflare Turnstile:** Hervorragend, aber CF-Account nötig
- **Nur Honeypot:** Nicht ausreichend gegen gezielten Spam

**Konsequenzen:**
+ DSGVO-konform ohne Cookie-Banner-Erweiterung
+ Gleiche UX wie reCAPTCHA
− Etwas weniger weit verbreitet
− Eigenes Konto bei hCaptcha nötig

---

## ADR-005: In-Memory Rate-Limit statt Redis

**Kontext:** Rate-Limiting auf `/api/submit`.

**Entscheidung:** In-Memory Map mit Sliding Window.

**Alternativen verworfen (jetzt):**
- **Upstash Redis:** Besser für Multi-Instance, aber Setup-Overhead
- **Vercel KV:** Lock-in zu Vercel

**Trigger für Migration:** Wenn wir auf Multi-Region Vercel oder mehrere VPS-Instances gehen → Umstieg auf Upstash dokumentiert in `docs/SECURITY.md`.

---

## ADR-006: i18n via JSON statt next-intl/react-i18next

**Kontext:** 3 Sprachen, ~150 Strings.

**Entscheidung:** Schlanker eigener Ansatz – JSON-Dateien direkt importieren.

**Alternativen verworfen:**
- **next-intl:** Solide, aber für 150 Strings Overkill
- **react-i18next:** Client-heavy, Runtime-Overhead

**Konsequenzen:**
+ Kein zusätzliches Dependency
+ Transparent, schnell
− Kein ICU-Format (Pluralisierung muss manuell)
− Kein automatisches Fallback-Chain

---

## ADR-007: Server/Client-Grenze für Manufacturer-Rules

**Kontext:** `Manufacturer`-Objekt enthält `rules` (Funktionen). Server Components können keine Funktionen an Client Components übergeben.

**Entscheidung:** `ManufacturerProvider` erhält nur serialisierbare Daten (meta + catalog). Rules werden client-seitig via `rules-registry.ts` anhand des Slugs aufgelöst.

**Alternativen verworfen:**
- **Rules nur server-seitig:** Schränkt Client-Filterlogik ein
- **Rules serialisieren:** Nicht möglich in JS

**Konsequenzen:**
+ Keine Laufzeit-Fehler durch Server→Client-Funktions-Transfer
+ Klare Trennung: Daten vom Server, Logik im Client-Bundle
− Neue Hersteller müssen rules in zwei Dateien registrieren (index.ts + rules-registry.ts)

---

## ADR-008: Altcha als Standard-Captcha-Provider (statt reCAPTCHA / hCaptcha)

**Kontext:** Phase 6 hatte hCaptcha als einzigen Provider fest verdrahtet. Für Phase 10 (WordPress-Plugin + Static Export) fallen alle Next.js-API-Routes weg — Captcha-Verifikation muss in PHP nachgebaut werden. Außerdem ist hCaptcha ein externer Dienst mit Datenschutz-Implikationen.

**Entscheidung:** Modulares Captcha-Provider-System mit `CAPTCHA_PROVIDER`-Env-Variable. Standard: **Altcha** (MIT-Lizenz, Proof-of-Work, lokal, kein externer API-Call). hCaptcha + reCAPTCHA v3 als optionale Adapter. `none` für Tests/Entwicklung.

**Verworfen:**
- hCaptcha als Standard: extern, DSGVO-sensibel, teuer bei Scale
- reCAPTCHA: Google-Abhängigkeit, Score-Heuristiken schwer zu debuggen
- Keine Abstraktion: macht Phase 10 PHP-Port schwieriger

**Konsequenzen:**
+ `ALTCHA_HMAC_KEY` in Produktion setzen (`openssl rand -hex 32`) — sonst gilt Dev-Fallback
+ PHP-Port in Phase 10 einfach: Altcha-Lib verfügbar als PHP-Package (altcha-org/altcha)
+ Kein externer Service → kein Datenschutz-Problem, keine Ausfallabhängigkeit
+ Wechsel zu hCaptcha/reCAPTCHA durch eine Env-Variable jederzeit möglich

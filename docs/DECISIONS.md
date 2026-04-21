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

## ADR-005: Rate-Limiting via WordPress Transients (Phase 10, aktualisiert Phase 11)

**Kontext:** In Phase 6 wurde ein In-Memory Rate-Limiter in `src/lib/security/rate-limit.ts` implementiert.
In Phase 10 (Static Export + WP-Plugin) wurden alle API-Routes entfernt. Die Datei wurde nie aufgerufen
und war totes Leichen-Code. In Phase 11 wurde sie gelöscht (🟠-2 Security Audit).

**Entscheidung:** Rate-Limiting in `class-rate-limit.php` via WordPress Transients.

**Warum WP Transients statt Upstash Redis:**
- WordPress läuft als dauerhafter PHP-FPM-Prozess — keine Instanz-Isolation wie Vercel-Lambdas
- Transients nutzen automatisch Object-Cache (Redis/Memcached) wenn ein Cache-Plugin installiert ist
- Kein zusätzlicher externer Service (Upstash) nötig; Komplexität bleibt im WP-Ökosystem

**IP-Extraktion:** Nur `CF-Connecting-IP` (Cloudflare) und `REMOTE_ADDR` — `X-Forwarded-For` und
`X-Real-IP` sind client-spoofbar und werden nicht ausgewertet.

**Upgrade-Pfad (falls nötig):** Object-Cache-Plugin (z.B. Redis Object Cache) installieren —
dann werden Transient-Reads/-Writes automatisch atomar über Redis abgewickelt, ohne Code-Änderung.

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

---

## ADR-009: Captcha serverseitig immer erzwingen — kein optional()-Pattern

**Kontext:** Die ursprüngliche Next.js-API (`app/api/submit/route.ts`) deklarierte `captchaToken` im Zod-Schema als `.optional()` und prüfte es nur per `if (data.captchaToken) { ... }`. Das erlaubte einen vollständigen Captcha-Bypass durch einfaches Weglassen des Feldes. `docs/SECURITY.md` beschrieb Layer 3 als „Server-seitige Token-Verifikation, HTTP 403 bei Fehler" — das war faktisch falsch. Zusätzlich gab `captcha.ts` in Dev-Mode (`NODE_ENV !== 'production'` und fehlendes Secret) automatisch `true` zurück — ein Environment-Konfigurationsfehler hätte Captcha auf Vercel Previews lautlos deaktiviert.

**Entscheidung:** In der PHP-Implementierung (Phase 10) wird `Captcha::verify()` **bedingungslos** aufgerufen. Fehlt das Token, liefern alle Provider `['success' => false]` — kein Early-Return, keine Sonderbehandlung. Es gibt keinen Dev-Mode-Bypass: PHP kennt kein `NODE_ENV`, und Captcha lässt sich ausschließlich über explizite Admin-Einstellungen (`captcha_enabled = false` oder `captcha_provider = none`) deaktivieren — nicht durch Umgebungsvariablen.

**Konsequenz:** Captcha ist fail-closed. Ein Request ohne Token erhält HTTP 403 — unabhängig davon, was das Frontend tut.

---

## ADR-010: Migration zu Static Export für WordPress-Deployment

**Kontext:** Die App sollte in Phase 10 als statisches Bundle in ein WordPress-Plugin eingebettet werden. Next.js `output: 'standalone'` erfordert einen Node.js-Server. KW Baustoffe betreibt nur WordPress auf shared Hosting — kein Node.js verfügbar.

**Entscheidung:** `output: 'export'` — Next.js generiert reines HTML/CSS/JS im `out/`-Ordner. Alle API-Routes entfernt. Serverseitige Logik (E-Mail-Versand, Captcha-Verifikation, Rate-Limiting) wandert als PHP in das WordPress-Plugin (Phase 10).

**Verworfen:**
- Vercel + iFrame: Cross-Origin-Probleme, externe Abhängigkeit, hCaptcha-Datenschutz
- Next.js standalone: Node.js-Prozess auf WordPress-Hosting nicht möglich
- Nuxt.js/Remix: Migration zu groß, Bestandscode in Next.js

**Konsequenzen:**
+ App deploy-bar auf jedem statischen Hosting (auch GitHub Pages)
+ Kein externer Dienst außer WordPress nötig
+ Build-Time-Snapshotting der Produktdaten — kein Server-Fetch bei Seitenaufruf
− Produktdaten-Updates erfordern neuen Build + Upload
− Server-seitige Features (ISR, Image Optimization, Middleware) nicht mehr verfügbar
− Zwei Codebases müssen synchron gehalten werden: Next.js-App + PHP-Plugin

---

## ADR-011: Event-Bus via Window CustomEvents (kein Pub/Sub-Framework)

**Kontext:** Solarrechner (Phase 11) und Konfigurator müssen auf derselben WordPress-Seite kommunizieren, ohne sich gegenseitig zu kennen. Beide sind auf `window` geladen. Kein gemeinsamer React-State, kein gemeinsamer Build.

**Entscheidung:** `window.dispatchEvent(new CustomEvent('kw-pv-tools:<name>', { detail }))` als Kommunikationskanal. Minimales `KW_PV_TOOLS_EVENT_BUS`-Object als Helper (emit/on/off) — kein externes Framework.

**Verworfen:**
- postMessage: nur für Cross-Origin (iFrame), hier nicht nötig
- Redux/Zustand als globaler Store: zu viel Dependency-Overhead für zwei unabhängige Werkzeuge
- WordPress-eigene REST-Callbacks: zu langsam, zu viel Netzwerk für UI-Koordination

**Konsequenzen:**
+ Beide Werkzeuge bleiben vollständig unabhängig voneinander
+ Debugging: `localStorage.setItem('kw-pv-tools:debug', '1')` aktiviert Konsolen-Logging aller Events
+ Neue Werkzeuge können jederzeit auf Events lauschen ohne Code-Änderungen in bestehenden Modulen
− Events sind fire-and-forget; wenn der Konfigurator beim Event-Empfang noch nicht geladen ist, geht das Event verloren → deshalb `app-ready`-Event + Retry-Logik

---

## ADR-012: Entfernung der Passwort-Auth-Middleware (Phase 8)

**Kontext:** `app/src/middleware.ts` enthielt einen Staging-Schutz: alle Routen außer `/_login` und `/api/*` wurden auf einen Login-Screen umgeleitet. Das Passwort wurde als Klartext-Cookie gesetzt (`document.cookie = kw_auth=${password}`) und serverseitig direkt verglichen (`cookie === PASSWORD`).

**Problem:** Dieser Schutz war in keinem Phase-Dokument erwähnt und hätte vor Go-Live aktiv zurückgebaut werden müssen. Er machte den primären Deployment-Pfad — `<iframe src="https://konfigurator.kw-baustoffe.de/solax/embed">` auf `kw-baustoffe.de` — in Production strukturell kaputt:

1. **iFrame-Redirect:** Ein nicht-authentifizierter Besucher sieht im iFrame den Login-Screen statt des Konfigurators.
2. **Third-Party-Cookie-Blockade:** Der Auth-Cookie ist auf `konfigurator.kw-baustoffe.de` gesetzt. Im iFrame-Kontext auf `kw-baustoffe.de` blockieren Safari ITP, Firefox ETP und Chromes Third-Party-Cookie-Phaseout den Cookie-Transfer — `SameSite=Lax` verstärkt das noch. D.h. selbst nach einmaligem Login auf der Konfigurator-Domain bleibt der iFrame dauerhaft gesperrt.
3. **Plaintext-Credential im Cookie:** Das echte Passwort stand als URL-encoded String im Cookie-Value — sichtbar in DevTools und Netzwerk-Logs.

**Entscheidung:** Middleware vollständig entfernt (Phase 8, `b58003b`). Staging-Schutz wird stattdessen auf Infrastruktur-Ebene gehandhabt (HTTP Basic Auth via nginx/Caddy, IP-Whitelist), nicht in der Applikation.

**Konsequenzen:**
+ iFrame-Embedding funktioniert ohne Cookie-Abhängigkeit
+ Keine Third-Party-Cookie-Problematik
+ Kein Credential im Client-seitigen Cookie
+ Static Export (Phase 9) macht serverseitige Middleware ohnehin unmöglich — die Entscheidung ist architektonisch verankert

# Changelog

Format: [Semantic Versioning](https://semver.org/)

## [Unreleased]

## [2.7.1] – 2026-04-24 – Code-Review-Fixes auf v2.7.0

### Fixed
- **AC-Coupling-Banner-Text**: Vorher versprach der gelbe Hinweis "Produktauswahl
  ist auf Retrofit-kompatible Komponenten eingeschränkt", tatsächlich wirkt der
  Filter aber nur in der Backup-Phase (Inverter/Battery/Wallbox/Accessory haben
  noch keine `compatibility`-Tags, der Migrations-Fallback lässt alles durch).
  Text jetzt präzise: "In der Backup-Phase werden nur retrofit-taugliche
  Optionen angezeigt; die übrigen Phasen zeigen das volle Sortiment."
- **IES-Inverter-Branch unerkannt**: `isX3Selected` prüfte nur `steps.includes("Split System")`
  und übersah damit den gesamten IES-Zweig (8 X3-Inverter-Produkte von
  `Solax X3-IES-4.0K` bis `15.0K`). Nutzer, die einen IES-Inverter wählten,
  bekamen die Backup-Filterung nicht zu sehen. Detection läuft jetzt primär
  über `selectedProduct.phaseType`-Tag am Katalogknoten; der Step-String-Pfad
  bleibt als Fallback für den Split-System-Zweig erhalten.
- **Dev-Warning-Spam**: `warnMissingPhaseTag` feuerte bei jedem Rendern der
  Backup-Phase für die Strukturknoten "Yes" und "No" — beide sind gewollt
  untagged (keine Produkte). Gate jetzt auf `product_name && !children`
  verschärft, sodass Warnungen nur noch echte Katalog-Lücken an Produkt-Leaves
  anzeigen.
- **Tschechische Plural-Grammatik**: Zubehör-Summary zeigte "2 položek"
  (Genitiv-Plural, korrekt für 5+) auch für 2–4. `pluralize()` nutzt jetzt
  `Intl.PluralRules` und unterscheidet one/few/other korrekt: 1 položka,
  2–4 položky, 5+ položek.
- **AC-Coupling-Banner i18n inline**: Vorher verschachtelte
  `lang === "de" ? ... : lang === "en" ? ... : ...` Ternaries, jetzt saubere
  `AC_COUPLING_NOTICE: Record<Lang, {title, body}>`-Map wie die anderen
  i18n-Konstanten.
- **Latente Detection-Regression**: Als Folge von B3 wurde sichergestellt,
  dass `getInverterPhaseType` vor einer unvollständigen Selektion null
  zurückgibt (statt falsch "x1" oder "x3"), sodass der Backup-Filter
  konservativ alle Optionen passieren lässt.

### Added
- **`PHASE_TITLES.finish`** für de/en/cs (vorher nur Fallback auf "finish").
- **`installationType`-Parameter in `validateCombination`**: Safety-Net gegen
  inkonsistente persistierte States (AC-Coupling-Modus + echtes Backup-Produkt
  im `selectedProduct`). "Kein Backup"-Opt-out ("No", kein phaseType) bleibt
  explizit valide.
- **93 `phaseType`-Tags an Inverter-Leaves** in de/en/cs (x1: 3 Produkte ×
  3 Locales; x3: 28 Produkte × 3 Locales inkl. IES).

### Changed
- **`next.config.ts` — `experimental.cpus` env-gated**: Nur noch gesetzt,
  wenn `NEXT_BUILD_CPUS` als env-Var vorliegt. Auf normalen Dev-Maschinen
  parallelisiert der Build wieder mit 4+ Workern. `sync-konfigurator.sh`
  setzt Default=1 für den CI-Container (OpenVZ, numproc=1100).
- **`clearInstallationType` dokumentiert**: Zurücksetzen bewahrt die
  aktuelle Sprache (`lang`), damit ein Sprachwechsel beim Mode-Umschalten
  nicht verlorengeht.

### Removed
- **`FlatProduct.phaseType`** war totes Feld (in keinem Code gesetzt oder
  gelesen). Entfernt.

## [2.7.0] – 2026-04-23 – Installations-Modus, i18n-Vervollständigung, phaseType-Refactor

### Added
- **Installations-Modus**: Konfigurator unterscheidet jetzt zwischen Neuanlage
  und AC-Kopplung/Retrofit. SolaX-Regel (`filterOptions`) erhält den neuen
  fünften Parameter `installationType` und filtert bei AC-Kopplung die
  Backup-Optionen auf die explizit kompatiblen Pfade (`compatibility: ["new"]`
  vs. `["new", "ac-coupling"]` am Katalogknoten). Ein Migrations-Fallback
  behält nicht-annotierte Pfade sichtbar, solange noch keine `compatibility`-
  Markierung vorliegt. Heuristik erkennt Legacy-Einträge mit "hac"/"retrofit"
  im Namen. (PR #1)
- **Strukturierte phaseType-Tags** (`"x1"` / `"x3"`) am `ConfigNode` ersetzen
  das bisherige Substring-Matching auf `product_name` für die X1/X3-Backup-
  Kompatibilität. Robuster gegen Produktumbenennungen. Fehlende Tags an
  Leaf-Produkten lösen eine dev-only `console.warn`-Meldung aus, statt still
  zu versagen. SolaX-Backup-Katalog ist in de/en/cs mit `phaseType: "x3"`
  annotiert. (PR #3)

### Changed
- **Vollständige i18n** für Konfigurator-UI in de/en/cs: `OptionGrid`-Leer-
  zustand, Zubehör-Summary (Singular/Plural), PowerSlider (Titel, Kontakt-CTA,
  ARIA-Label, "keine Produkte"-Fallback), `ConfiguratorShell` Accessory-
  Fallback. Keine deutschen Festtexte mehr im englischen oder tschechischen
  Locale. (PR #2)

### Fixed
- Mobile-Layout: Batterie-Slider-Labels und die stacked Part-Images
  überlappten sich auf schmalen Viewports. Slider-Labels wurden neu
  positioniert; Stacks bekommen adäquaten Abstand.

### Infrastructure
- `next.config.ts` setzt `experimental.cpus = 1`, damit der Static-Export-
  Build auf Umgebungen mit harter `numproc`-Begrenzung (OpenVZ-Container)
  nicht an EAGAIN bei `spawn` scheitert. Auf Hosts ohne Limit nur marginal
  langsamer.

## [2.6.2] – Hotfix: composer.lock, UpgradeCleaner, Preview-Ticket-ID

### Fixed
- `composer.lock` war nicht synchron mit `composer.json`: der mpdf-Eintrag
  fehlte vollständig, `composer install --no-dev` verweigerte deshalb die
  Auflösung und das CI-Build-ZIP von v2.6.0 wurde ohne mpdf ausgeliefert —
  das PDF-Feature (Headline von v2.6.0) warf zur Laufzeit
  `RuntimeException('mpdf nicht verfügbar')`. Lockfile jetzt regeneriert;
  `mpdf/mpdf`-Constraint gleichzeitig von `^8.1` auf `~8.1.0` verschärft,
  damit `composer update` in Zukunft nur Patch-Releases innerhalb der
  8.1.x-Serie zieht und nicht versehentlich auf 8.2+ springt (was PHP-
  7.4-Hosts brechen würde).
- `UpgradeCleaner` (eingeführt in v2.5.5 gegen das "files could not be
  copied"-Problem auf Shared Hosts mit gemischten Linux-User-Ownern) war
  seit Commit `a769b91` (v2.5.8) versehentlich nicht mehr registriert —
  die Klassendatei blieb im Tree, aber weder `require_once` noch
  `UpgradeCleaner::register()` wurden ausgeführt. Auto-Update auf v2.6.0
  schlug auf betroffenen Hosts identisch fehl wie vor v2.5.5. Registrierung
  wiederhergestellt.
- PDF-Endpoint (`class-pdf-endpoint.php`) rief bei jedem "Konfiguration als
  PDF"-Klick `TicketId::generate()` auf und inkrementierte damit den
  persistenten Zähler in `wp_options`. Ein User, der 10× das PDF öffnete
  und anschließend submittete, bekam Ticket #11 statt #1 — jede Annahme
  "Ticket N = N-te Submission" driftete stumm. Preview-PDFs tragen jetzt
  eine ephemere `PV-PREVIEW-YYYYMMDD-<hex>`-ID aus `random_bytes(3)`, die
  nie persistiert oder wiederverwendet wird. Echte Submissions nutzen
  weiterhin unverändert `TicketId::generate()` via `SubmitHandler`.

## [2.5.5] – Hotfix: Auto-Update-Install scheiterte mit "files could not be copied"

### Fixed
- WordPress's `copy_dir()` in `Plugin_Upgrader::install_package()` scheiterte
  auf Shared Hosts, wenn bestehende Plugin-Dateien von einem anderen Linux-User
  angelegt wurden als dem Webserver-User (klassisch: Plugin via FTP als
  `ftpuser` hochgeladen, PHP-FPM läuft als `www-data`). Die Meldung "The update
  cannot be installed because some files could not be copied" erschien, Update
  brach ab.
  Neue `UpgradeCleaner`-Klasse hooked sich in `upgrader_pre_install` ein und
  löscht das `kw-pv-tools/`-Verzeichnis proaktiv — der Directory-Owner darf
  auch fremdeigene Dateien darin löschen (Linux-Directory-Semantik), während
  das Überschreiben scheiterte. WP's Install startet danach auf leerem
  Verzeichnis und klappt.
- **Wichtig:** Der Fix ist selbst Teil von v2.5.5 — das **erste** Update
  auf v2.5.5 muss manuell via FTP oder WP-Admin "Plugin hochladen" passieren,
  alle folgenden Updates funktionieren dann automatisch.

## [2.5.4] – Hotfix: konfigurator-Seiten Hydration

### Fixed
- CSP-Header wurde bei `send_headers` mit `script-src 'self'` ausgeliefert,
  bevor der Shortcode-Render `CSP::allow_inline()` aufrufen konnte. Browser
  blockierte alle `self.__next_f.push(…)` Next.js-RSC-Inline-Scripts, React
  hydrierte nie → Buttons wie „Klassisches System" / „Alles in Einem IES"
  waren nicht klickbar. `CSP::send_csp()` erkennt die Konfigurator-Seite
  jetzt autark via `has_shortcode()` / `has_block()` auf dem Main-Post zum
  richtigen Hook-Zeitpunkt.

### Changed (Batch A — review fix-up)
- Provider-System für Captcha auf Altcha-only reduziert. hCaptcha und reCAPTCHA v3 entfernt inkl. PHP-Backend, Frontend-Widgets und NPM-Dependencies. Siehe `docs/DECISIONS.md` ADR-013.
- Shortcode-Asset-Rewriting umfasst jetzt auch `<img>`/`<link>` im Body-Markup — Produktbilder laden endlich aus dem Plugin-URL (vorher 404).
- PDF-Generation vollständig entfernt: `app/src/lib/pdf.tsx`, `@react-pdf/renderer` aus `package.json`. Der PDF-Versand war seit der Phase-10-Migration (Static Export + WP-Plugin) funktional tot, wurde aber weiterhin in Docs und README versprochen. Die Benachrichtigungs- und Bestätigungs-Mails sind reine HTML-Mails via `wp_mail()`.
- `post-export.mjs` scannt Manufacturer-Verzeichnisse dynamisch statt SolaX hardcoded.

### Fixed (previous)
- CSP: `strict-dynamic` entfernt (blockierte ohne Hashes alle Scripts).
- CSRF-Schutz via Origin-Check auf `/submit`.
- Altcha-Replay-Schutz via Transient-Fingerprint.
- Rate-Limiter atomisiert (`START TRANSACTION` + `SELECT … FOR UPDATE`).
- Honeypot-Check vor Rate-Limit und Validation.
- Path-Traversal-Guard in `Assets::extract_asset_tags()`.

## [2.1.0] – 2026-04-20 (vormals getaggt v2.1.0)
- Phase-11-Meilenstein: UX & Ops (siehe `PHASE_10_DONE.md`, `readme.txt`).

## [1.0.0] – 2026-04-20

### Added
- Initial Release: SolaX-Konfigurator (Wechselrichter, Backup, Batterie, Wallbox)
- Multi-Hersteller-Architektur (SolaX als erster Hersteller, Registry für weitere)
- Security-Hardening (CSP, Rate-Limit, hCaptcha, Honeypot, Input-Sanitization)
- CI-Pipeline (GitHub Actions: validate + vitest + data-tests + build)
- Vollständige Dokumentation (ONBOARDING, ARCHITECTURE, DECISIONS, ADD_MANUFACTURER, SECURITY, FAQ, USER_MANUAL, DEPLOY)
- PDF-Export mit KW-Branding (@react-pdf/renderer)
- E-Mail-Integration (Resend, Vertrieb + Kunden-Bestätigung)
- iFrame-Embedding mit postMessage-Resize
- 3-sprachig (DE/EN/CS)
- 68 Daten-Tests (Node.js, datenbasiert)
- Passwort-Schutz (Staging-Phase)

## [0.x.x] – Prä-1.0.0
Iterative Entwicklung (Phasen 0–6), siehe Git-History.

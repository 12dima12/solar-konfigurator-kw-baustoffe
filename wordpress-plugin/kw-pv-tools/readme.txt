=== KW PV Tools ===
Contributors: kwbaustoffe
Tags: solar, pv, konfigurator, photovoltaik
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 2.7.6
License: Proprietary

PV-Werkzeuge für KW Baustoffe: PV-Konfigurator und Solarrechner als WordPress-Plugin.

== Description ==

KW PV Tools stellt den SolaX PV-Konfigurator als WordPress-Shortcode/Gutenberg-Block bereit.
Interessenten wählen ihre PV-Anlage Schritt für Schritt zusammen; die Konfiguration wird
per E-Mail an den Vertrieb übermittelt. Spam-Schutz durch Altcha (self-hosted PoW-Captcha,
keine externe Datenweitergabe). Rate-Limiting, Honeypot, Ticket-IDs und Submission-Log inklusive.

Shortcode: [kw_pv_konfigurator]

== Changelog ==

= 2.7.6 =
* feat: IES-Wechselrichter bekommen jetzt die passende Notstrom-Box
  "X3 EPS PBOX 60 kW" (B-210-10081) statt der für Split-System-Hybride
  gedachten X3 EPS Box / X3 Matebox Advanced. Neuer Katalog-Tag
  `inverterLine` ("hybrid" | "ies") trennt die Produktlinien im Filter;
  Ultra-Wechselrichter bleiben vorerst untagged (zeigen weiterhin alle
  Backup-Optionen).
* fix: Altcha-Widget nach Hersteller-Doku aufgeräumt:
  - `language`-Attribut wird jetzt gesetzt (Widget-Texte
    "Ich bin ein Mensch" etc. erscheinen in de/en/cs),
  - passende i18n-Datei wird pro Sprache dynamisch nachgeladen,
  - `expired`-Event setzt den Captcha-Token zurück → Submit sperrt sich
    wieder, User muss erneut bestätigen,
  - Hinweistext "Captcha abgelaufen — bitte erneut bestätigen" eingeblendet.

= 2.7.5 =
* fix: Captcha funktionierte nicht. altcha v3.x hat das Attribut von
  `challengeurl` (v2.x) auf `challenge` umbenannt — der Konfigurator
  schrieb noch das alte, das Widget ignoriert und nie eine Challenge
  fetched → der Submit-Button blieb ewig disabled. Jetzt `challenge`
  gesetzt. Zusätzlich sichtbare Fehler-UI (Netzwerk-/Load-/Timeout-
  Fehler werden dem User angezeigt statt silent zu verschwinden),
  10-s-Timeout mit Reload-Button, Dev-Logs für State-Changes.

= 2.7.4 =
* fix: "CSS gesprengt" auf Konfigurator-Seiten — die CSP auf der Parent-Seite
  enthielt eine vollständige Direktiven-Liste (`script-src`, `style-src`,
  `font-src`, `connect-src`, `frame-src`), die reihum das Theme zerstörte:
  Google Fonts → blockiert → Theme-Typo fällt auf System-Fonts zurück
  (wirkt wie kaputtes Layout), Tag-Manager/Analytics → blockiert, YouTube-
  Einbettungen → blockiert. Ab sofort sendet das Plugin auf Konfigurator-
  Seiten nur noch `frame-ancestors` (Clickjacking-Schutz) + die generischen
  Security-Header (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`). Das Theme läuft unverändert, der Konfigurator
  funktioniert weiter.

= 2.7.3 =
* feat: Triple-Power-S Batterieauswahl beginnt jetzt bei 3 Modulen
  (S 2.5: 7,5 kWh / S 36: 10,8 kWh) — kleinere Konfigurationen waren
  zuvor nicht auswählbar, obwohl `minModules: 3` das erlaubt.
* feat: X3-Hybrid-Serie (Non-PRO) erscheint bei jeder Leistungsklasse
  links, X3-HYB-G4 PRO rechts. Bisher war die 12.0 kW-Karte invertiert.
* feat: Neues Produktfoto für die X3-Hybrid-Serie (G4, Non-PRO),
  abgestimmt auf das Herstellermaterial von SolaX (at.solaxpower.com).

= 2.7.2 =
* fix (Plugin-Integration): Der CSP-Header (`Content-Security-Policy`) wurde
  bisher auf ALLEN Frontend-Seiten der Site gesendet — nicht nur auf
  Konfigurator-Seiten. `script-src 'self'` blockiert inline-JS, was viele
  Themes für Mobile-Menu-Toggles, Analytics-Snippets und Tag-Manager
  verwenden. Ergebnis: Menu-Toggle tot, sobald das Plugin aktiv war.
  Fix: CSP-Header wird jetzt NUR gesetzt, wenn die aktuelle Seite tatsächlich
  den Konfigurator-Shortcode / -Block enthält. Alle anderen Seiten bleiben
  unberührt.

= 2.7.1 =
* fix: AC-Coupling-Banner versprach "alle Produktkategorien eingeschränkt",
  tatsächlich wirkt der Filter nur in der Backup-Phase. Text jetzt ehrlich.
* fix: Der IES-Inverter-Branch (Solax X3-IES-4.0K ... 15.0K) wurde von der
  X1/X3-Detection nicht erkannt; Backup-Filter war dort wirkungslos. Jetzt
  über strukturierte phaseType-Tags am Produktknoten gelöst.
* fix: Dev-Warning-Spam für die Backup-Strukturknoten "Yes" / "No" —
  Warnung feuert jetzt nur noch auf echten Produkt-Leaves ohne phaseType.
* fix: Tschechische Pluralregel (2-4 Positionen zeigten fälschlich das
  Genitiv-Plural "položek"; jetzt korrekt "položky" für 2-4, "položek" für 5+).
* fix: AC-Coupling-Banner nutzt wieder die UI-Map-Konvention (vorher inline
  Ternary-Cascades).
* fix: `PHASE_TITLES.finish` ergänzt für de/en/cs.
* fix: `validateCombination` lehnt AC-Coupling mit Backup-Produkt ab
  (Safety-Net für inkonsistente persistierte States); "Kein Backup"-Opt-out
  bleibt weiter erlaubt.
* refactor: `FlatProduct.phaseType` (tot) entfernt. `installationType`-
  Parameter auch bei `validateCombination` verfügbar.
* build: `next.config.ts` `experimental.cpus` nur noch gesetzt, wenn
  `NEXT_BUILD_CPUS` als env-Var gesetzt ist. sync-konfigurator.sh setzt
  sinnvollen Default=1 für den CI-Container.

= 2.7.0 =
* feat: Installations-Modus im Konfigurator (Neuanlage vs. AC-Kopplung/Retrofit).
  SolaX-Regel filtert die Backup-Optionen bei AC-Kopplung auf explizit
  freigegebene Pfade; untagged Katalog-Einträge bleiben bis zur vollständigen
  Annotierung als Migrations-Fallback sichtbar.
* feat: Vollständige i18n (de/en/cs) für Zubehör-Summary, OptionGrid-Leerzustand
  und PowerSlider — keine festverdrahteten deutschen Fallback-Texte mehr im
  englischen oder tschechischen Locale.
* refactor: Backup-Phasen-Kompatibilität (X1/X3) läuft jetzt über strukturierte
  `phaseType`-Tags im Katalog statt Produktname-Substring-Matching. Robuster
  gegenüber Umbenennungen; Dev-Warnung bei fehlenden Tags.
* fix: Mobile-Layout der Batterie-Slider-Labels und der Teil-Stacks — Labels
  und Icons überlappen nicht mehr auf schmalen Viewports.

= 2.6.2 =
* fix: composer.lock neu generiert und mpdf-Constraint auf ~8.1.0 gepinnt,
  damit das CI-ZIP mpdf mitbringt und zukünftige Updates den PHP-7.4-Support
  nicht brechen.
* fix: UpgradeCleaner wieder registriert — die upgrader_pre_install-Hook war
  in v2.5.8 versehentlich mit dem Asset-Prefix-Fix rausgeflogen, dadurch
  brach Auto-Update auf Shared Hosts wieder mit "files could not be copied".
* fix: Der "Konfiguration als PDF"-Button erzeugte bei jedem Klick eine
  echte Ticket-ID via TicketId::generate() und inkrementierte damit den
  persistenten Zähler. Preview-PDFs tragen jetzt eine ephemere
  PV-PREVIEW-YYYYMMDD-<hex>-ID; der Submission-Counter zählt erst beim
  echten Absenden.

= 2.5.5 =
* fix: Auto-Update-Installation scheiterte auf Shared Hosts mit "files could not
  be copied"-Fehler, weil WP's copy_dir() fremdeigene Plugin-Dateien nicht
  überschreiben konnte. Ein upgrader_pre_install-Hook löscht jetzt den
  kw-pv-tools/-Ordner vor dem Extract; danach startet WP aus einem sauberen
  Zustand und das Update klappt. (Einmal manuell via FTP auf v2.5.5
  aktualisieren, danach funktionieren alle zukünftigen Updates via WP-Admin.)

= 2.5.4 =
* fix: CSP `unsafe-inline` wird jetzt bei send_headers (nicht erst bei Shortcode-Render)
  entschieden — Next.js-RSC-Inline-Scripts können ausführen, React-Hydration läuft,
  Buttons werden klickbar.

= 2.1.0 =
* feat: WP Mail SMTP Dependency-Check mit abweisbarem Hinweis
* feat: Captcha Ein/Aus-Schalter (zweistufige Konfiguration)
* feat: Mehrere Vertriebs-Empfänger (kommasepariert)
* feat: Ticket-Referenznummern (KW-PV-YYYY-NNNNN)
* feat: Submissions-Log als Custom Post Type (30-Tage-Aufbewahrung, DSGVO-Hooks)
* feat: System-Health-Check-Seite
* feat: Test-E-Mail-Button
* feat: E-Mail-Vorschau-Seite mit iframe-Isolation
* feat: GitHub-Auto-Update via plugin-update-checker

= 1.0.0 =
* Erste Veröffentlichung: PV-Konfigurator, REST-API, Altcha/hCaptcha/reCAPTCHA, wp_mail()

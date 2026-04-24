=== KW PV Tools ===
Contributors: kwbaustoffe
Tags: solar, pv, konfigurator, photovoltaik
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 2.7.21
License: Proprietary

PV-Werkzeuge für KW Baustoffe: PV-Konfigurator und Solarrechner als WordPress-Plugin.

== Description ==

KW PV Tools stellt den SolaX PV-Konfigurator als WordPress-Shortcode/Gutenberg-Block bereit.
Interessenten wählen ihre PV-Anlage Schritt für Schritt zusammen; die Konfiguration wird
per E-Mail an den Vertrieb übermittelt. Spam-Schutz durch Altcha (self-hosted PoW-Captcha,
keine externe Datenweitergabe). Rate-Limiting, Honeypot, Ticket-IDs und Submission-Log inklusive.

Shortcode: [kw_pv_konfigurator]

== Changelog ==

= 2.7.21 =
* fix: "Meine Auswahl"-Panel (CurrentSetupSidebar) hatte auf Mobile
  verrutschtes Padding — Items klebten am Rand, Text-Spalten und
  Produktbilder überlappten mit dem transparenten Overlay. Jetzt
  sauber gerahmt mit `px-5 py-4`-Padding, Produktbild hat eine feste
  48×48 Kachel mit hellem Hintergrund, Text wird bei Bedarf
  umgebrochen (`break-words`) statt abgeschnitten.
* fix: Mobile-Breite des Panels war auf 75% Viewport fixiert
  (`w-3/4`), das wirkte zu schmal. Jetzt `w-full` auf Mobile, bleibt
  ab sm-Breakpoint bei `max-w-sm` kompakt auf Desktop.
* fix: Beim Öffnen der "Meine Auswahl"-Ansicht springt der Parent
  jetzt per postMessage an den iframe-Anfang. User, die weiter unten
  gescrollt waren, müssen nicht erst manuell hochscrollen um das
  Panel oben im Viewport zu sehen.
* fix: Batterie-Menü zeigte als Wechselrichter-Kontext den internen
  Step-Key ("Three-phase inverter X3") statt des tatsächlich
  ausgewählten Produktnamens. Jetzt steht hier der Produktname aus
  `selectedProduct.product_name` (z.B. "Solax G4 X3-Hybrid-5.0-D, CT,
  ohne WiFi 3.0"). Bei AC-Kopplung bleibt die Zeile ausgeblendet
  (kein Wechselrichter gewählt).

= 2.7.20 =
* chore: Wallbox-Root-Option "Eine" in "X3-HAC 11/22 kW" umbenannt
  (de/en/cs). Label ist jetzt konkret zum Produkt statt generisch.
  Die Kindknoten (11 kW / 22 kW / Buchse / Kabel / Standard / Mit
  Display) bleiben unverändert.
* fix: Deutsche Sprachtexte vollständig durchgezogen — englische Leaks
  im sichtbaren DE-Tree beseitigt:
  - Batterie-Phase-Überschrift "1) Select Battery" → "Batterie auswählen"
    (auch en/cs lokalisiert).
  - Inverter-Labels "(Strings)" → "(Stränge)" in 12 DE-MPPT-Labels
    (8/10/12/15/20 kW Hybrid-Varianten).
  - Wallbox-Titel "Steckdose oder Stecker" auf "Buchse oder Kabel"
    harmonisiert (Power 22 zog mit Power 11 gleich).

= 2.7.19 =
* fix: Bei AC-Kopplung ist die Standard-Auswahl im Zubehör-Schritt jetzt
  "Kein Dongle" und "Kein Smart Meter". Bei Neuinstallation bleibt die
  bisherige Voreinstellung (WiFi+LAN-Dongle, Smart-Meter passend zur
  Inverter-Phase) erhalten, damit der User dort nur noch Anpassungen
  machen muss. Retrofit-Kunden werden nichts aufgedrängt — sie aktivieren
  Dongle / Smart-Meter bei Bedarf selbst.

= 2.7.18 =
* fix: Smart-Meter-Auswahl ist jetzt auch bei AC-Kopplung sichtbar.
  Vorher filterte der Accessory-Schritt die Smart-Meter nach der
  Inverter-Phase (X1 / X3) — bei AC-Kopplung gibt es aber keinen
  Inverter-Schritt, also war die Liste leer. Bei AC-Kopplung werden
  jetzt beide Smart-Meter (1-phasig Solax Chint DDSU666 und 3-phasig
  DTSU666) zur Auswahl angeboten; der Kunde wählt den für seine
  bestehende PV-Anlage passenden.

= 2.7.17 =
* fix: Holding Bracket + Base Plate verschwinden jetzt aus dem Zubehör-
  Schritt für alle heutigen Batterie-Serien. Laut Hersteller-Feedback
  sind diese Montage-Teile nur für T-BAT H 5.8 V3 vorgesehen; Triple
  Power S/T und IES HS50E-D haben eigene Montagelösungen im Gehäuse.
  Default des `usesMountingAccessories`-Flags umgedreht: nur explizit
  als `true` markierte Serien zeigen die Komponenten. Aktuell nur
  T-BAT H 5.8 V3 (derzeit noch im "Bald verfügbar"-Teaser-Zustand).
* fix: AC-Kopplung zeigte nur reduzierte Auswahl in der Notstrom- und
  Wallbox-Phase (z.B. keine "Kein Ladegerät"-Option im Wallbox-Schritt,
  weil der HAC-Heuristik-Filter sie ausblendete). Der AC-Kopplung-
  Compatibility-Filter ist komplett deaktiviert; in AC-Kopplung sieht
  der Kunde jetzt dieselbe volle Auswahl wie bei Neuinstallation und
  entscheidet selbst, was er zur bestehenden PV-Anlage hinzunimmt.

= 2.7.16 =
* fix: Endlos-Render-Loop im BatteryConfigurator bei AC-Kopplung
  (React-Error #185 "Maximum update depth exceeded"). Der Zustand-
  Selector für inverter-Steps fiel bei AC-Kopplung immer auf `?? []`
  zurück und erzeugte jedes Mal ein neues leeres Array — Zustand
  verglich die Referenz, sah sie als geändert und triggerte den
  nächsten Render, ad infinitum. Fix: modul-level EMPTY_STEPS-
  Konstante als stabile Fallback-Referenz. Damit kippt der iframe
  auf iOS Safari auch nicht mehr ("This page couldn't load").

= 2.7.15 =
* fix: iOS Safari zeigte beim Klick auf "AC-Kopplung" manchmal
  "This page couldn't load" und brach den iframe ab. Ursache war ein
  Race zwischen dem postMessage-basierten Scroll-to-Top und dem
  ResizeObserver-getriggerten Höhen-Update; der iframe wurde während
  des Höhensprungs reclaimed. `scrollToTop` wird jetzt nach einem
  kurzen Tick (60ms) ausgeführt, nachdem der Re-Render und das
  erste Resize-Event durch sind.
* feat: ErrorBoundary um den gesamten Konfigurator. Wenn ein
  unerwarteter React-Fehler auftritt, zeigt der iframe jetzt eine
  Fehlermeldung mit Reload-Button statt leer zu werden (was iOS
  Safari als Navigation-Failure interpretieren könnte).

= 2.7.14 =
* feat: AC-Kopplung-Flow auf Wunsch angepasst: Reihenfolge jetzt
  Batterie → Notstrom → Wallbox → Zubehör (statt vorher
  Batterie → Wallbox → Zubehör ohne Notstrom-Schritt). Der Notstrom-
  Schritt bietet dem Retrofit-Kunden weiterhin die Auswahl
  AC-kompatible Optionen (der compatibility-Filter zeigt bei
  AC-Kopplung praktisch die "Kein Notstrom"-Option).
* feat: Batterieauswahl bei AC-Kopplung zeigt jetzt auch die
  IES-Batterie (HS50E-D) neben den drei Triple-Power-Serien. Bisher
  war IES auf Neuinstallationen mit IES-Wechselrichter begrenzt; in
  AC-Kopplung (Retrofit) wird jetzt das volle Serien-Sortiment
  angeboten, damit Kunden mit bestehender IES-Anlage auch den
  passenden Speicher nachrüsten können.

= 2.7.13 =
* feat: AC-Kopplung (Retrofit) 1:1 nach GBC-Referenz. Wer den Installations-
  modus "AC-Kopplung" wählt, überspringt Wechselrichter- und Notstrom-
  Phase komplett und landet direkt bei der Batterie-Auswahl, danach
  Wallbox und Zubehör. Die StepIndicator-Nummerierung und der
  Fortschrittsbalken passen sich dynamisch an (3 Schritte statt 5).
  Rückweg: Back-Button aus Batterie-Schritt 0 → öffnet wieder den
  Picker "Neue Installation / AC-Kopplung".

= 2.7.12 =
* fix: Captcha-Widget ging in den Fehler-Zustand ("Captcha konnte nicht
  geladen werden — widget reported error state"). Root Cause: das
  PHP-Backend sendete die Challenge seit v2.6.2 in einem nested
  `{_version:1, parameters:{...}, signature}`-Format, das altcha@3 weder
  als v1 (kein Top-Level-`challenge`-Feld) noch als v3 (kein
  `parameters.nonce`/`keyPrefix`) erkennt → `isChallengeValid()` gibt
  false → "Challenge validation failed". Rückkehr zum flachen
  v2-Format (algorithm/challenge/salt/maxNumber/signature auf Root-
  Ebene); altcha v3 hat einen eingebauten v1→v3-Translator der dieses
  Format wieder lesen kann.

= 2.7.11 =
* fix: IES-Batterie (HS50E-D) zeigte fälschlich "3× Holding Bracket" und
  "6× Base Plate" als automatisch hergeleitetes Zubehör an. Das sind
  Triple-Power-spezifische Montage-Teile (siehe Produktnamen "Solax
  Triple Power ..."); IES hat eine eigene Montagelösung. Neues Feld
  `usesMountingAccessories` auf `BatterySeries`; für IES auf `false`
  gesetzt, der Batterie-Zubehör-Block wird dann komplett ausgeblendet.
* fix: Deutschsprachige Oberfläche war an mehreren Stellen englisch —
  namentlich in der Breadcrumb ("Split System › Three-phase inverter X3
  › 8.0 kW") und in der Zusammenfassung ("Notstrom: No" /
  "Wallbox: No Charger"). Jetzt:
  - Breadcrumb resolved jeden Step auf das lokalisierte `label`
    (neue Helper-Funktion `resolveStepLabels`),
  - `confirmProduct`-Fallback nutzt `label` vor dem rohen Key, sodass
    Opt-out-Leaves mit `value: null` die deutsche Bezeichnung "Nein" /
    "Kein Ladegerät" statt des englischen Keys zeigen.
* fix: Deutsche Umlaut-Fehler im Katalog/Messages korrigiert
  ("Ladegerat" → "Ladegerät", "Wahlen" → "Wählen", "wahlen" → "wählen",
  "Gerat" → "Gerät").

= 2.7.10 =
* chore: In der Wallbox-Phase die "Für mehr als eine Wallbox kontaktieren
  Sie bitte unseren Vertrieb."-Option entfernt. Verbleibende Auswahl:
  "Eine" (mit Leistungsklassen & Varianten) und "Kein Ladegerät".

= 2.7.9 =
* feat: Triple Power S 2.5 (HS25, 2,5 kWh/Modul) und Triple Power S 3.6
  (HS36, 3,6 kWh/Modul) werden jetzt als zwei getrennte Batterieserien
  angeboten. Vorher waren sie in einer gemeinsamen Serie "S 25/S 36" mit
  einem durchmischten Slider zusammengefasst; jetzt hat jede Variante
  ihren eigenen Kapazitäts-Slider mit nur den zu dem Modultyp passenden
  Stops (7.5/10/12.5/…/32.5 kWh für S 2.5; 10.8/14.4/18/…/46.8 kWh für S 3.6).
* feat: Batterie T-BAT H 5.8 V3 wird als "Bald verfügbar"-Teaser im
  Thumbnail-Footer gelistet (gegraut + Amber-Badge), nicht klickbar.
  Sobald Hersteller die Montage-Daten finalisiert, werden die Stops
  nachgereicht und die Serie ist auswählbar.

= 2.7.8 =
* feat: Batteriekonfigurator im GBC-Stil umgebaut — die verfügbaren
  Batterieserien liegen jetzt als kleine Produktbilder UNTEN, die gewählte
  Serie nimmt den Hauptbereich ein (Slider, Montage-Varianten, kWh-Anzeige).
  Klick auf ein Thumbnail wechselt die Serie.
* feat: Kapazitäts-Slider mit großer gelber "X.X kWh"-Pill überm Thumb
  (aktualisiert sich dynamisch) + neuen `−`/`+` Buttons an den Rändern,
  damit man auch ohne präzises Treffen der Tick-Dots durch die Stops
  springen kann.
* feat: "X.XX kWh Batterie Montage"-Textzeile zeigt live die aktuell
  gewählte Montage-Kapazität.
* feat: Power-Slider (Inverter-Auswahl) bekommt dieselben `−`/`+` Buttons —
  Mobile-UX für alle Slider im Konfigurator einheitlich.

= 2.7.7 =
* revert: Das in v2.7.6 eingeführte IES-eigene Backup-Produkt
  (X3 EPS PBOX 60 kW) und die zugehörige `inverterLine`-Filter-Logik
  werden entfernt — die Backup-Auswahl kehrt zur v2.7.5-Variante zurück
  (Ja → X3 EPS Box / X3 Matebox Advanced, Nein). Die Altcha-Doku-
  Abgleiche (language-Attribut, i18n-Import, expired-Event) aus v2.7.6
  bleiben erhalten.

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

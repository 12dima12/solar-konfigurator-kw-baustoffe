=== KW PV Tools ===
Contributors: kwbaustoffe
Tags: solar, pv, konfigurator, photovoltaik
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 2.7.0
License: Proprietary

PV-Werkzeuge für KW Baustoffe: PV-Konfigurator und Solarrechner als WordPress-Plugin.

== Description ==

KW PV Tools stellt den SolaX PV-Konfigurator als WordPress-Shortcode/Gutenberg-Block bereit.
Interessenten wählen ihre PV-Anlage Schritt für Schritt zusammen; die Konfiguration wird
per E-Mail an den Vertrieb übermittelt. Spam-Schutz durch Altcha (self-hosted PoW-Captcha,
keine externe Datenweitergabe). Rate-Limiting, Honeypot, Ticket-IDs und Submission-Log inklusive.

Shortcode: [kw_pv_konfigurator]

== Changelog ==

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

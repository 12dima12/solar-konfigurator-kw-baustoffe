=== KW PV Tools ===
Contributors: kwbaustoffe
Tags: solar, pv, konfigurator, photovoltaik
Requires at least: 6.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 2.5.5
License: Proprietary

PV-Werkzeuge für KW Baustoffe: PV-Konfigurator und Solarrechner als WordPress-Plugin.

== Description ==

KW PV Tools stellt den SolaX PV-Konfigurator als WordPress-Shortcode/Gutenberg-Block bereit.
Interessenten wählen ihre PV-Anlage Schritt für Schritt zusammen; die Konfiguration wird
per E-Mail an den Vertrieb übermittelt. Spam-Schutz durch Altcha (self-hosted PoW-Captcha,
keine externe Datenweitergabe). Rate-Limiting, Honeypot, Ticket-IDs und Submission-Log inklusive.

Shortcode: [kw_pv_konfigurator]

== Changelog ==

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

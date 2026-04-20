# KW PV Tools – Admin-Handbuch (v2.1.0)

## Übersicht

Das Plugin stellt unter **WP-Admin → Einstellungen** vier Unterseiten bereit:

| Seite | Zweck |
|---|---|
| KW PV Tools | Haupteinstellungen (E-Mail, Captcha, Rate-Limit) |
| PV-Anfragen | Submission-Log (Custom Post Type) |
| PV-System | System-Health-Check |
| PV-E-Mail-Vorschau | Vorschau beider E-Mail-Templates |

---

## Einstellungen

### E-Mail

| Feld | Beschreibung |
|---|---|
| Vertriebs-E-Mail | Empfänger der Benachrichtigungs-Mail. Mehrere Adressen kommasepariert: `a@firma.de, b@firma.de` |
| Absender-E-Mail | `From:`-Adresse. WP Mail SMTP empfohlen. |

### Captcha

| Feld | Beschreibung |
|---|---|
| Captcha aktiviert | Globaler Ein/Aus-Schalter |
| Provider | Altcha (Standard, kostenlos) / hCaptcha / reCAPTCHA v3 / Kein Captcha |
| Altcha HMAC-Key | Wird bei Aktivierung automatisch generiert. Geheim halten. |
| Altcha Komplexität | Empfohlen: 50.000–200.000 |
| hCaptcha / reCAPTCHA Keys | Nur ausfüllen wenn der entsprechende Provider gewählt ist |

### Sicherheit & Allgemein

| Feld | Beschreibung |
|---|---|
| Rate-Limit | Max. Submits pro Stunde pro IP (Standard: 3) |
| Standard-Sprache | Sprache für E-Mails und UI (de/en/cs) |

---

## Submission-Log

- Einträge werden 30 Tage aufbewahrt, dann automatisch gelöscht (WP-Cron).
- DSGVO: Export und Löschung über **WP-Admin → Werkzeuge → Datenschutz**.
- Direkt einsehbar unter **WP-Admin → Einstellungen → PV-Anfragen**.

---

## Ticket-Nummern

Jede Einreichung erhält automatisch eine Referenznummer im Format `KW-PV-2026-00001`.
Der Zähler setzt sich jedes Jahr zurück.

---

## System-Check

**WP-Admin → Einstellungen → PV-System** prüft:

- PHP-Version (≥ 7.4)
- WordPress-Version (≥ 6.0)
- Altcha-Bibliothek (Composer)
- WP Mail SMTP aktiv
- Konfigurator-Bundle vorhanden
- REST-API erreichbar
- Altcha HMAC-Key gesetzt
- Vertriebs-E-Mail konfiguriert
- WP-Cron aktiv

---

## Test-E-Mail

Auf der Einstellungsseite befindet sich der Button **Test-E-Mail senden**.
Er schickt eine Dummy-Konfiguration an alle konfigurierten Vertriebs-Empfänger.

---

## E-Mail-Vorschau

**WP-Admin → Einstellungen → PV-E-Mail-Vorschau** zeigt beide Templates:
- **Benachrichtigung (Vertrieb)**: enthält Kontakt + ausgewählte Produkte + Ticket-ID
- **Bestätigung (Kunde)**: einfache Eingangsbestätigung mit Ticket-Referenznummer

---

## Auto-Update

Das Plugin bezieht Updates direkt aus GitHub-Releases des Repositorys
`12dimal2/solar-konfigurator-kw-baustoffe`. Sobald ein neues Release-Tag
(z.B. `v2.1.1`) gepusht wird, erscheint der Update-Hinweis im WP-Admin.

Voraussetzung: `yahnis-elsts/plugin-update-checker` via Composer installiert.

---

## Deployment

```bash
# 1. Bundle bauen + in Plugin synchronisieren
./wordpress-plugin/build/sync-konfigurator.sh

# 2. ZIP erzeugen
./wordpress-plugin/build/package.sh
# → wordpress-plugin/builds/kw-pv-tools-v2.1.0.zip

# 3. In WordPress hochladen
# WP-Admin → Plugins → Neu hinzufügen → Plugin hochladen → ZIP wählen
```

Alternativ: GitHub-Release erstellen → CI baut ZIP automatisch.

---

## Shortcode-Referenz

```
[kw_pv_konfigurator]
[kw_pv_konfigurator manufacturer="solax"]
[kw_pv_konfigurator preset_kwp="10" preset_battery="10"]
[kw_pv_konfigurator route="embed"]
```

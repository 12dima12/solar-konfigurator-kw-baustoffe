# Smoke Test Runbook

Manueller End-to-End-Check vor jedem Live-Deployment. Dauert **ca. 20 Minuten**, wenn das lokale Environment schon läuft.

> **Zweck:** Fängt Integrations-Bugs, die statische Analyse und Unit-Tests nicht sehen — z.B. "CSP blockiert ein Script", "E-Mail geht raus aber kommt nicht an", "iFrame-Shortcode lädt, aber Produktbilder fehlen". Der Runbook deckt alle im Review identifizierten kritischen Pfade ab.

---

## 0. Voraussetzungen

- Docker Desktop (oder Docker Engine + `docker compose` v2 CLI)
- `pnpm` und `node` auf dem Host (für den React-Build)
- Terminal im Repo-Root

---

## 1. Environment hochfahren

```bash
# (a) React-Bundle bauen und ins Plugin synchronisieren
./wordpress-plugin/build/sync-konfigurator.sh

# (b) WP + DB + MailHog starten
cd wordpress-plugin/dev
docker compose up -d

# (c) WP installieren, Plugin aktivieren, Privacy-Page anlegen, Seite mit Shortcode erzeugen
./setup.sh
```

Danach:

| Service | URL |
|---|---|
| WordPress Frontend | http://localhost:8080/ |
| Konfigurator-Seite | http://localhost:8080/konfigurator/ |
| WP-Admin | http://localhost:8080/wp-admin (admin/admin) |
| Plugin-Einstellungen | http://localhost:8080/wp-admin/options-general.php?page=kw-pv-tools |
| System-Check | http://localhost:8080/wp-admin/options-general.php?page=kw-pv-tools-system |
| E-Mail-Vorschau | http://localhost:8080/wp-admin/options-general.php?page=kw-pv-tools-mail-preview |
| Submissions-Log | http://localhost:8080/wp-admin/edit.php?post_type=kw_pv_submission |
| MailHog Inbox | http://localhost:8025 |

---

## 2. Checkliste

Jeder Punkt ist **binary** — grün oder rot. Wenn irgendwas rot ist: **nicht live gehen**, stattdessen Fund als GitHub-Issue dokumentieren.

### 2.1 Plugin-Aktivierung & Admin-UI

- [ ] **Plugin aktiv**
  - Öffne `/wp-admin/plugins.php` → KW PV Tools steht auf "Aktiv"
- [ ] **Keine PHP-Errors beim Aktivieren**
  - `docker compose exec wordpress tail -n 100 /var/www/html/wp-content/debug.log` → keine `PHP Fatal error` oder `PHP Warning` mit `kw-pv-tools`
- [ ] **Admin-Einstellungsseite lädt**
  - Öffne KW PV Tools Settings (URL-Tabelle oben)
  - Erwartung: Formular mit E-Mail, Captcha, Sicherheit
- [ ] **Altcha HMAC-Key ist maskiert (B5)**
  - Das Key-Feld zeigt Punkte, nicht Klartext
  - Klick auf "Anzeigen" → wird sichtbar, Label wechselt zu "Verbergen"
- [ ] **Captcha-Dropdown hat nur 2 Optionen (A2)**
  - "Altcha (Standard, self-hosted PoW)" und "Kein Captcha (nur für interne Tests)"
  - Weder hCaptcha noch reCAPTCHA auswählbar

### 2.2 System-Check

- [ ] **Öffne System-Check-Seite**
  - Erwartung: alle Checks grün **außer** `WP Mail SMTP` (ist im Dev optional) und eventuell `Datenschutzseite`
- [ ] **Datenschutzseite grün (B2)**
  - `setup.sh` hat eine Placeholder-Page angelegt + unter Settings → Privacy eingetragen
  - Wenn rot: `Settings → Privacy → Change your Privacy Policy page` → Seite wählen
- [ ] **Altcha HMAC-Key grün**
  - "Key gesetzt (mind. 16 Zeichen)"
- [ ] **Konfigurator-Bundle grün**
  - "v…, erzeugt …" — kommt aus `kw-pv-tools-manifest.json`
  - Wenn rot: Schritt 1 (sync-konfigurator.sh) war nicht erfolgreich

### 2.3 E-Mail-Fluss (MailHog)

- [ ] **Test-E-Mail funktioniert**
  - KW PV Tools Settings → unten "Test-E-Mail senden"
  - Erwartung: Success-Notice in Admin + Mail in MailHog an `info@kw-baustoffe.de`
- [ ] **E-Mail-Vorschau zeigt beide Templates**
  - Öffne Mail-Vorschau-Seite
  - Klick "Benachrichtigung (Vertrieb)" → iframe zeigt Blau-Header "Neue PV-Konfiguration"
  - Klick "Bestätigung (Kunde)" → iframe zeigt "Ihre PV-Konfiguration"
  - Erwartung: Kein inline-Script läuft im iframe (sandbox="allow-same-origin" blockiert)

### 2.4 Frontend-Rendering

- [ ] **Shortcode rendert**
  - Öffne http://localhost:8080/konfigurator/
  - Erwartung: Konfigurator sichtbar, erste Phase "Montagetyp wählen"
- [ ] **Keine CSP-Violations in DevTools → Console (A2/CSP-Fix)**
  - Seite neu laden mit offener Konsole
  - Erwartung: keine `Refused to execute/load` Meldungen
  - Wenn welche da: SHA-256 des blockierten Scripts berechnen und in `class-csp.php::SCRIPT_HASHES` eintragen, Bundle neu bauen
- [ ] **Produktbilder laden (A1)**
  - Klick IES → Klick "4.0 kW" → Produktkarte mit Produktbild
  - DevTools → Network → Filter `products/` → alle 200, keine 404
- [ ] **Altcha-Widget lädt**
  - Letzte Phase (Wallbox-Auswahl + Submit-Formular) erreichen
  - Altcha-Widget ist sichtbar mit "I am human"-Checkbox
  - Nach Klick: "Verified" erscheint (PoW rechnet ~1-3 s im Browser)
- [ ] **Datenschutz-Link sichtbar (B2)**
  - Unter dem Altcha-Widget: "Mit dem Absenden stimmen Sie … zu. Datenschutzerklärung"
  - Klick auf "Datenschutzerklärung" → öffnet Privacy-Page in neuem Tab
  - Wenn der Link fehlt: `setup.sh` hat die Privacy-Page nicht verknüpft — siehe 2.2

### 2.5 Submit-Fluss

- [ ] **Erfolgreiches Submit**
  - Konfiguration bis Ende durchklicken, Formular ausfüllen (Name, E-Mail, optional Telefon/Nachricht)
  - Altcha lösen, "Zur Anfrage" klicken
  - Erwartung: Success-Screen mit grünem Häkchen
- [ ] **Zwei Mails in MailHog**
  - MailHog öffnen
  - Eine Mail an `admin@kw-pv-tools.test` (Vertriebs-Mail), Subject enthält `[KW-PV-2026-00001]`
  - Eine Mail an die User-E-Mail aus dem Formular (Bestätigung), enthält Ticket-Referenz
- [ ] **Ticket-ID folgt Pattern `KW-PV-YYYY-NNNNN` (B3)**
  - `docker compose exec wpcli wp post list --post_type=kw_pv_submission --format=csv` → Spalte "post_title" zeigt `KW-PV-2026-00001 — Name`
- [ ] **Submission im Log sichtbar**
  - WP-Admin → KW PV Tools → PV-Anfragen
  - Eintrag vorhanden, Post-Meta-Felder `_kw_pv_ticket`, `_kw_pv_contact_email` gesetzt

### 2.6 Security-Härtung

- [ ] **Rate-Limit greift (B4 + bestehender Rate-Limiter)**
  - 3 weitere Submits hintereinander (gleiche IP)
  - Der 4. Submit → MailHog bekommt keine neue Mail, UI zeigt Fehler
  - Via curl: `curl -X POST -H "Origin: http://localhost:8080" http://localhost:8080/wp-json/kw-pv-tools/v1/submit -d '{}' -i` → Status 429
- [ ] **CSRF-Check greift (B1)**
  - ```
    curl -X POST -H "Content-Type: application/json" \
      http://localhost:8080/wp-json/kw-pv-tools/v1/submit \
      -d '{"manufacturer":"solax","selections":[{"phase":"inverter"}],"contact":{"name":"x","email":"x@x.de"}}' -i
    ```
  - Erwartung: Status **403** (kein Origin, kein Referer → geblockt)
  - Wenn du das von einer Seite mit anderem Origin aufrufst: ebenfalls 403
- [ ] **Captcha-Replay-Schutz greift (bestehend + B4)**
  - Submit mit einem frischen Altcha-Token → 200
  - Gleichen Token per curl noch einmal senden (DevTools → Network → Request-Body kopieren)
  - Erwartung: Status **403** mit `"reason": "replay"`
- [ ] **Oversized inputs werden abgewiesen (B4)**
  - ```
    curl -X POST -H "Content-Type: application/json" \
      -H "Origin: http://localhost:8080" \
      http://localhost:8080/wp-json/kw-pv-tools/v1/submit \
      -d '{"manufacturer":"solax","selections":[{"phase":"inverter"}],"contact":{"name":"'$(printf 'A%.0s' {1..500})'","email":"x@x.de"}}' -i
    ```
  - Erwartung: Status 200 mit verkürztem Namen (100 Zeichen) in der Vertriebsmail — nicht 500 und nicht ein 500-Zeichen-Name

### 2.7 Uninstall-Cleanup (für die Paranoiden)

- [ ] **Plugin-Deaktivierung lässt CPT stehen**
  - `docker compose exec wpcli wp plugin deactivate kw-pv-tools`
  - `wp post list --post_type=kw_pv_submission --format=count` → Anzahl unverändert
- [ ] **Plugin-Uninstall räumt Settings**
  - `docker compose exec wpcli wp plugin uninstall kw-pv-tools`
  - `wp option get kw_pv_tools_settings` → `Could not get option. Does it exist?`
  - **Bekannt offen (Batch C1):** Ticket-Counter-Optionen, Submissions-CPT-Posts, Cron-Hook und alte `kw_pv_tools_ticket_counter`/`kw_pv_tools_ticket_year` bleiben — wird in Batch C adressiert

---

## 3. Fehlerbehandlung

| Symptom | Vermutete Ursache | Fix |
|---|---|---|
| "Manifest nicht gefunden" in rotem Kasten auf der Konfigurator-Seite | Bundle nicht synchronisiert | `./wordpress-plugin/build/sync-konfigurator.sh` |
| Alle Scripts 404 in DevTools | Bundle-Pfade falsch rewritten | `class-assets.php::rewrite_asset_uri` prüfen — wurde der Plugin-URL korrekt konfiguriert? |
| Produktbilder 404 | A1-Regression | `class-assets.php::rewrite_body_asset_paths` prüfen — `/products/` noch in `$asset_prefixes`? |
| Altcha lädt nicht / bleibt weiß | Dev-Mock-API liefert ungültige Challenge oder HMAC-Key leer | System-Check aufrufen, HMAC-Key-Status prüfen |
| Captcha-Verify schlägt mit `reason: parse-error` | Frontend sendet altchaToken in falschem Format | Browser-DevTools → Network → Request-Body prüfen, `captchaToken` muss base64 sein |
| MailHog bleibt leer | MU-Plugin nicht geladen | `docker compose logs wordpress` nach `phpmailer_init`-Output suchen; Datei muss in `wp-content/mu-plugins/mailhog-smtp.php` liegen |
| Submit hängt endlos | Backend-Timeout (10s) ausgelöst | `docker compose logs wordpress` / MailHog-Availability prüfen |

---

## 4. Teardown

```bash
cd wordpress-plugin/dev
docker compose down -v        # -v dropt auch den DB-Volume für komplett frischen Reset
```

---

## 5. Was der Runbook NICHT abdeckt

- **Cross-Browser:** Nur Chromium-DevTools werden oben erwähnt. Vor Go-Live mindestens 1× Firefox und 1× Safari durchklicken (iPhone-Safari hat Quirks bei Altcha-Worker).
- **Echte Email-Deliverability:** MailHog fängt lokal alles ab. Vor Go-Live: einmal mit echtem WP Mail SMTP gegen Produktions-DNS testen (SPF/DKIM/DMARC) — das gehört zum Hosting-Setup, nicht zum Plugin.
- **Lastverhalten:** Rate-Limit wird funktional verifiziert (4. Submit = 429), aber nicht unter Last (z.B. 100 parallele Submits). Wenn das in der Produktion relevant wird, Apache-Bench oder k6 dranbauen.
- **DSGVO-Formulierung:** Der Privacy-Notice-Text ist **juristisch nicht abgenommen** (siehe Commit B2). Vor Go-Live durch KW-Rechtsberater prüfen lassen.

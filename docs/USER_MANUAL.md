# User Manual – Für Dima

Dieses Dokument beschreibt, was du selbst ohne Entwickler-Hilfe tun kannst.

Der Konfigurator läuft als WordPress-Plugin (`kw-pv-tools`) auf deiner WordPress-Installation.
Alle Einstellungen findest du unter **WP-Admin → Einstellungen → KW PV Tools**.

---

## Häufige Aufgaben

### E-Mail-Empfänger ändern

1. WP-Admin → Einstellungen → KW PV Tools
2. Feld **Vertriebs-E-Mail (Empfänger)** bearbeiten
3. Mehrere Adressen kommasepariert: `vertrieb@kw-baustoffe.de, chef@kw-baustoffe.de`
4. **Einstellungen speichern** klicken

Kein Deployment, kein Code-Zugriff nötig.

### E-Mail-Versand testen

1. WP-Admin → Einstellungen → KW PV Tools
2. Ganz unten: **Test-E-Mail senden**
3. Eine Dummy-Konfiguration geht an `info@kw-baustoffe.de`

### Captcha aktivieren / deaktivieren

1. WP-Admin → Einstellungen → KW PV Tools → Abschnitt **Captcha**
2. Checkbox **Captcha aktiviert** setzen oder entfernen
3. Einstellungen speichern

### Produktdaten aktualisieren (SolaX)

SolaX-Produktdaten kommen vom GBC-Solino-Konfigurator. Wenn dort neue Produkte auftauchen oder sich Daten ändern:

1. Terminal im Projekt-Ordner öffnen (oder Entwickler bitten)
2. Ausführen: `./scripts/refresh-solax.sh`
3. Das Skript lädt die neuen Daten und zeigt dir die Änderungen (Diff)
4. Falls alles gut aussieht: die Schritte im Skript-Output ausführen
5. `./wordpress-plugin/build/sync-konfigurator.sh` → baut neues Bundle
6. `./wordpress-plugin/build/package.sh` → erzeugt ZIP
7. ZIP in WP-Admin hochladen: Plugins → Plugin aktualisieren

### Neue Hersteller anbinden (Fronius, Huawei)

Das ist eine Entwickler-Aufgabe. Gib dem Entwickler `docs/ADD_MANUFACTURER.md` als Briefing.

### Texte ändern (Headlines, Buttons, etc.)

Das ist eine Entwickler-Aufgabe. Die Texte liegen in `app/src/messages/{de,en,cs}.json`.

### Farben ändern

Das ist eine Entwickler-Aufgabe. Die Farben sind in `app/src/app/globals.css` als CSS-Variablen definiert.

### Produktbilder austauschen

1. Neues Bild vorbereiten (am besten WebP, max. 800×800px)
2. Datei unter `app/public/products/` ersetzen (gleicher Dateiname)
3. Falls Dateiname sich ändert: catalog.json anpassen (Entwickler)
4. Bundle neu bauen (siehe „Produktdaten aktualisieren")

---

## Was du NICHT selbst tun solltest

- Code-Dateien (`.ts`, `.tsx`, `.php`) bearbeiten
- `package.json` oder `composer.json` ändern
- WordPress-Datenbank direkt bearbeiten

Diese Dinge brauchen einen Entwickler.

---

## Monitoring

### Wie sehe ich eingegangene Anfragen?

WP-Admin → Einstellungen → PV-Anfragen — alle Submissions der letzten 30 Tage.

### Wie sehe ich, ob etwas kaputt ist?

WP-Admin → Einstellungen → PV-System — zeigt grüne/rote Checks für alle Systemkomponenten.

### E-Mails kommen nicht an

1. WP-Admin → Einstellungen → PV-System prüfen (WP Mail SMTP-Status)
2. WP-Admin → Einstellungen → KW PV Tools → Test-E-Mail senden
3. Falls fehlgeschlagen: WP Mail SMTP Plugin konfigurieren (SMTP-Zugangsdaten vom Hoster)

---

## Build-Variablen (für Entwickler)

Die einzige authoritative Quelle für Next.js-Env-Variablen ist **`app/.env.example`**.
Dort sind alle vom Build tatsächlich gelesenen Variablen mit Standardwerten dokumentiert.

```bash
cp app/.env.example app/.env.local  # für lokale Entwicklung
```

Laufzeit-Einstellungen (E-Mail-Adresse, Captcha, Rate-Limit) werden **nicht** per
Env-Var gesteuert — sie sind im WP-Admin unter Einstellungen → KW PV Tools konfiguriert.

---

## Support

Wenn etwas kaputt ist und du nicht weißt, was zu tun ist:

1. WP-Admin → Einstellungen → PV-System — dort steht was fehlt
2. Plugin deaktivieren und reaktivieren (WP-Admin → Plugins)
3. Entwickler kontaktieren

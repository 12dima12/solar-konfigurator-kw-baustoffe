# User Manual – Für Dima

Dieses Dokument beschreibt, was du selbst ohne Entwickler-Hilfe tun kannst.

---

## Häufige Aufgaben

### Produktdaten aktualisieren (SolaX)

SolaX-Produktdaten kommen vom GBC-Solino-Konfigurator. Wenn dort neue Produkte auftauchen oder sich Daten ändern:

1. Terminal im Projekt-Ordner öffnen (oder Entwickler bitten)
2. Ausführen: `./scripts/refresh-solax.sh`
3. Das Skript lädt die neuen Daten und zeigt dir die Änderungen (Diff)
4. Falls alles gut aussieht: `git add . && git commit -m "chore: solax catalog update"`
5. `git push` – deployted automatisch (ca. 2–3 Minuten)

### Neue Hersteller anbinden (Fronius, Huawei)

Das ist eine Entwickler-Aufgabe. Gib dem Entwickler `docs/ADD_MANUFACTURER.md` als Briefing.

### E-Mail-Empfänger ändern

1. Vercel-Konsole öffnen: https://vercel.com/dashboard
2. Projekt auswählen → Settings → Environment Variables
3. `RESEND_TO_ADDRESS` bearbeiten
4. "Redeploy" klicken

### Texte ändern (Headlines, Buttons, etc.)

Das ist eine Entwickler-Aufgabe. Die Texte liegen in `app/src/messages/{de,en,cs}.json`.

### Farben ändern

Das ist eine Entwickler-Aufgabe. Die Farben sind in `app/src/app/globals.css` als CSS-Variablen definiert.

### Produktbilder austauschen

1. Neues Bild vorbereiten (am besten WebP, max. 800×800px)
2. Datei unter `app/public/products/` ersetzen (gleicher Dateiname)
3. Falls Dateiname sich ändert: catalog.json anpassen (Entwickler)
4. Commit + Push

---

## Was du NICHT selbst tun solltest

- Code-Dateien (`.ts`, `.tsx`) bearbeiten
- `package.json` ändern
- `next.config.ts` ändern
- `.env`-Dateien committen (echte Secrets nie ins Git!)

Diese Dinge brauchen einen Entwickler.

---

## Monitoring

### Wie sehe ich, wie viele Anfragen reinkommen?
- Vercel Dashboard → Analytics
- E-Mails kommen in dein `vertrieb@kw-baustoffe.de` Postfach

### Wie sehe ich, ob etwas kaputt ist?
- Vercel Dashboard → Deployments (rot/grün)
- Sentry Dashboard (falls konfiguriert) → Fehler-Liste

### Kosten-Monitoring
- **Vercel:** Settings → Billing (Hobby-Tier kostenlos bis 100k Besucher/Monat)
- **Resend:** Dashboard → Usage (Free Tier: 3.000 E-Mails/Monat)
- **hCaptcha:** Dashboard → Usage (Free Tier: 1M Requests/Monat)

---

## Support

Wenn etwas kaputt ist und du nicht weißt, was zu tun ist:
1. Vercel-Deployment rückgängig machen: Dashboard → Deployments → Previous → "Promote to Production"
2. Entwickler kontaktieren

---

## Konfiguration (ab Phase 9: WordPress-Plugin)

Ab Phase 9 gibt es keine Vercel-Deployment mehr. Alle serverseitigen Einstellungen
(E-Mail, Captcha, Rate-Limiting) werden im WP-Admin unter **KW PV Tools → Einstellungen** konfiguriert.

**Build-Variable:**

| Variable | Wert | Beschreibung |
|---|---|---|
| `NEXT_PUBLIC_API_BASE` | `/wp-json/kw-pv-tools/v1` | API-Basis (Same-Origin in Produktion) |

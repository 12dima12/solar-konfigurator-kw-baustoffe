# FAQ

## Für Entwickler

**F: Wo fange ich an?**  
A: `docs/ONBOARDING.md`

**F: Wie füge ich einen neuen Hersteller hinzu?**  
A: `docs/ADD_MANUFACTURER.md`

**F: Wie teste ich den iFrame-Modus lokal?**  
A: `pnpm dev` starten, dann `tests/iframe-host.html` in einem zweiten Browser öffnen (via VSCode Live Server oder `python3 -m http.server`).

**F: Tests laufen lokal, aber CI schlägt fehl. Warum?**  
A: Häufige Ursache: Env-Variablen fehlen. Für den Static-Export-Build wird nur `NEXT_PUBLIC_API_BASE` und `CAPTCHA_PROVIDER=none` benötigt — beides ist in `.github/workflows/ci.yml` gesetzt.

**F: Build schlägt fehl mit "Manufacturer validation failed". Was tun?**  
A: `node scripts/validate-manufacturers.mjs` direkt ausführen – zeigt exakt, welche Datei/Feld fehlt.

**F: Warum funktioniert die Sprachumschaltung nicht?**  
A: Prüfe, dass der Key in allen 3 Sprachdateien (`de/en/cs.json`) existiert.

**F: TypeScript-Fehler bei `as any` — darf ich das?**  
A: An keiner Stelle. Die früheren `as any`-Ausnahmen in `api/submit/route.ts` existieren nicht mehr (Route in Phase 9 entfernt).

---

## Für Dima

**F: Kann ich selbst Produkte hinzufügen?**  
A: Per Commit in `src/manufacturers/solax/catalog.json` theoretisch ja – aber lass das einen Entwickler machen, damit der Build nicht fehlschlägt.

**F: Wie lange dauert ein Plugin-Update?**  
A: Bundle bauen (~2 Min), ZIP hochladen und in WP aktivieren (~1 Min). Insgesamt ca. 5 Minuten.

**F: Wie ändere ich den E-Mail-Empfänger?**  
A: WP-Admin → Einstellungen → KW PV Tools → Feld **Vertriebs-E-Mail** → Speichern. Kein Deployment nötig.

**F: Was passiert, wenn der E-Mail-Versand nicht funktioniert?**  
A: WP-Admin → Einstellungen → KW PV Tools → **Test-E-Mail senden**. Falls fehlgeschlagen: WP Mail SMTP Plugin prüfen (WP-Admin → Einstellungen → PV-System zeigt den Status). Anfragen landen trotzdem im Submissions-Log (WP-Admin → Einstellungen → PV-Anfragen) — kein Lead geht verloren.

**F: Wie tausche ich ein Produktbild aus?**  
A: Neues Bild (WebP, max. 800×800px) unter `app/public/products/` ersetzen. Falls Dateiname sich ändert: Entwickler kontaktieren für catalog.json-Anpassung.

**F: Was ist der Unterschied zwischen /configurator und /embed?**  
A: `/configurator` ist die vollständige Seite (mit Navigation, direkt aufrufbar). `/embed` ist für den iFrame auf kw-baustoffe.de – kein Header, kein Footer, passt die Höhe automatisch an.

---

## Allgemein

**F: Darf ich SolaX-Bilder wirklich nutzen?**  
A: Als SolaX-Lizenzhändler ja. Siehe `docs/LEGAL.md` + Lizenzvertrag bei Dima.

**F: Was, wenn GBC-Solino den Konfigurator umbaut?**  
A: Unsere Daten sind Snapshots in `catalog.json`. Solange wir sie pflegen, sind wir unabhängig. Das Refresh-Skript könnte kaputtgehen – dann manuell Produktdaten pflegen.

**F: Kann der Konfigurator in andere Websites eingebettet werden?**  
A: Ja. Da der Konfigurator als WordPress-Plugin auf derselben Domain läuft, gibt es keine Cross-Origin-Restriktionen. iFrame-Einbindung via `[kw_pv_konfigurator route="embed"]` Shortcode.

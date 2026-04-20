# Benutzerhandbuch – KW PV Konfigurator

## Für Dima / Vertrieb

### Eingehende Konfigurationen lesen

Jede abgeschlossene Konfiguration erzeugt:
1. Eine E-Mail an `vertrieb@kw-baustoffe.de` mit Kundendaten und Komponentenliste
2. Ein A4-PDF als Anhang mit allen Produktcodes

Der Betreff lautet: `Neue PV-Konfiguration: [Kundenname] ([Datum])`

### Produktcodes zuordnen

| Präfix | Typ |
|---|---|
| `G-21d-3I...` | SolaX X3-IES Wechselrichter |
| `G-21s-6...` | SolaX X1 Hybrid G4 |
| `G-21c-4...` | SolaX X3 Hybrid G4 (CT, ohne WiFi) |
| `G-21d-4P...` | SolaX X3 Hybrid G4 (WiFi+LAN) |
| `G-21s-3H...` | SolaX X3 Ultra |
| `G-210-...` | Backup-Komponenten (Matebox etc.) |
| `B-210-...` | EPS Box / Backup |
| `EV-210-...` | Wallbox (HAC) |

### Produktdaten aktualisieren (bei SolaX-Änderungen)

Bitte an den Techniker weitergeben:

```bash
cd /root/solax-rebuild
node analysis/generate_catalog.mjs
cp analysis/catalog.json app/src/data/catalog.json
# Dann neu deployen
```

## Für den Webmaster

### Konfigurator einbetten

Füge folgenden Code auf der gewünschten WordPress-Seite ein:

```html
<iframe
  src="https://konfigurator.kw-baustoffe.de/embed?lang=de"
  style="width:100%;border:0;min-height:800px;"
  id="kw-configurator"
  title="KW PV Konfigurator"
></iframe>
<script>
window.addEventListener("message", function(e) {
  if (e.origin !== "https://konfigurator.kw-baustoffe.de") return;
  if (e.data && e.data.type === "kw-configurator-resize") {
    document.getElementById("kw-configurator").style.height = e.data.height + "px";
  }
});
</script>
```

### Logs einsehen (Vercel)

1. Vercel Dashboard → `kw-konfigurator` → Logs
2. Filter: `[submit]` für alle Konfigurationsabschlüsse

### Rollback

Im Vercel Dashboard unter "Deployments" auf das letzte stabile Deployment klicken → "Promote to Production".

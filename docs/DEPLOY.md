# Deployment-Anleitung

## Entscheidung: E-Mail-Integration

**Option A (empfohlen): Resend**
- Konto anlegen: https://resend.com
- Domain `kw-baustoffe.de` verifizieren
- API-Key erzeugen und in `.env.local` / Vercel-Env setzen
- Kosten: kostenlos bis 3.000 E-Mails/Monat

**Option B: Lexware/Openhandwerk-Webhook**
- Webhook-URL von Openhandwerk anfordern
- In `/api/submit/route.ts` ergänzen: `fetch(process.env.CRM_WEBHOOK_URL, ...)`
- Entscheidung offen — Dima klärt mit Openhandwerk

---

## Option 1: Vercel (empfohlen)

```bash
cd app
npm install -g vercel
vercel login
vercel              # Staging
vercel --prod       # Produktion (nur nach Dima-Freigabe!)
```

Umgebungsvariablen in Vercel Dashboard setzen:
- `RESEND_API_KEY`
- `SALES_EMAIL`
- `FROM_EMAIL`

**Subdomain:** `konfigurator.kw-baustoffe.de`
→ In Vercel: Custom Domain hinzufügen, DNS-Eintrag bei Hoster setzen

## Option 2: Eigener Server (Node.js + PM2 + Nginx)

```bash
# Build
cd app
NODE_OPTIONS="--max-old-space-size=2048" pnpm build

# Start mit PM2
npm install -g pm2
pm2 start node_modules/.bin/next --name kw-konfigurator -- start -p 3000
pm2 save && pm2 startup
```

Nginx-Konfiguration:
```nginx
server {
  listen 443 ssl;
  server_name konfigurator.kw-baustoffe.de;

  location / {
    proxy_pass http://localhost:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

## iFrame-Einbettung in kw-baustoffe.de

Code-Snippet für den Webmaster:

```html
<iframe
  src="https://konfigurator.kw-baustoffe.de/embed?lang=de"
  style="width: 100%; border: 0; min-height: 800px;"
  id="kw-configurator"
  title="KW PV Konfigurator"
  loading="lazy"
></iframe>
<script>
  window.addEventListener("message", (e) => {
    if (e.origin !== "https://konfigurator.kw-baustoffe.de") return;
    if (e.data?.type === "kw-configurator-resize") {
      document.getElementById("kw-configurator").style.height = e.data.height + "px";
    }
  });
</script>
```

## Datenaktualisierung (Strategie A: Statisch)

Produktdaten sind im Build eingefroren. Für eine Aktualisierung:

```bash
# 1. Neue Daten abrufen (solax-rebuild/)
node analysis/generate_catalog.mjs

# 2. Ins App kopieren
cp analysis/catalog.json app/src/data/catalog.json
cp analysis/products.json app/src/data/products.json

# 3. Neu deployen
cd app && vercel --prod
```

Empfehlung: Quartalsweise aktualisieren oder bei SolaX-Produktänderungen.

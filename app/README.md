# KW PV Solutions Konfigurator

iFrame-embeddable PV-Konfigurator unter KW-Branding. Clean-Room-Rebuild auf Basis von SolaX-Produktdaten.

## Tech-Stack

- Next.js 15 (App Router, TypeScript strict)
- Tailwind CSS v4 + shadcn/ui
- Zustand (State)
- react-hook-form + zod (Formular)

## Setup

```bash
pnpm install
pnpm dev       # http://localhost:3000
pnpm build
```

## Seiten

| Route | Beschreibung |
|---|---|
| `/` | Konfigurator (Hauptseite) |
| `/embed` | iFrame-optimierte Variante |
| `/api/submit` | POST-Endpoint für Konfigurationsabschluss |

## iFrame-Einbindung

```html
<iframe src="https://konfigurator.kw-baustoffe.de" id="kw-konfigurator"
  style="width:100%;border:none;"></iframe>
<script>
window.addEventListener("message", (e) => {
  if (e.data?.type === "kw-configurator-resize") {
    document.getElementById("kw-konfigurator").style.height = e.data.height + "px";
  }
});
</script>
```

## Produktdaten aktualisieren

```bash
# Im solax-rebuild/ Verzeichnis
node analysis/generate_catalog.mjs
node analysis/extract_products.mjs
cp analysis/catalog.json app/src/data/catalog.json
cp analysis/products.json app/src/data/products.json
```

## Umgebungsvariablen (Phase 4)

```env
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
SALES_EMAIL=vertrieb@kw-baustoffe.de
```

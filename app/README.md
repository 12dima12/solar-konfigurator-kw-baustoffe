# KW PV Solutions – Konfigurator (App)

Next.js-App des PV-Konfigurators. Für Projekt-Übersicht, Architektur und Deployment
→ siehe Dokumentation im **Repo-Root** (`../docs/`).

## Lokale Entwicklung

```bash
cp .env.example .env.local   # Keys eintragen
pnpm install
pnpm dev                     # http://localhost:3000 → /solax/configurator
```

Env-Variablen: **`../docs/USER_MANUAL.md`** (vollständige Liste + wo die Keys zu holen sind).

## Build

```bash
pnpm build   # Prebuild validiert Hersteller-Daten, dann Next.js Build
pnpm start
```

## Routen

| Route | Beschreibung |
|---|---|
| `/solax/configurator` | Konfigurator (Vollseite) |
| `/solax/embed` | iFrame-optimierte Variante |
| `/api/submit` | POST-Endpoint (Rate-Limit + Captcha + E-Mail + PDF) |

## iFrame-Einbindung

```html
<iframe src="https://konfigurator.kw-baustoffe.de/solax/embed"
  id="kw-konfigurator" style="width:100%;border:none;"></iframe>
<script>
window.addEventListener("message", (e) => {
  if (e.data?.type === "kw-configurator-resize") {
    document.getElementById("kw-konfigurator").style.height = e.data.height + "px";
  }
});
</script>
```

## Weiterführende Docs

| Dokument | Inhalt |
|---|---|
| `../docs/ONBOARDING.md` | 30-Min-Einstieg für Entwickler |
| `../docs/ARCHITECTURE.md` | Architektur + Datenfluss |
| `../docs/ADD_MANUFACTURER.md` | Neuen Hersteller integrieren |
| `../docs/SECURITY.md` | Security-Maßnahmen |
| `../docs/DEPLOY.md` | Vercel + eigener Server |
| `../docs/USER_MANUAL.md` | Für Dima: Env-Variablen, Monitoring |

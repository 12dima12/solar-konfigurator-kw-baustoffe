# KW PV Solutions – Konfigurator (App)

Next.js-App des PV-Konfigurators. Wird als **Static Export** gebaut und vom
WordPress-Plugin `kw-pv-tools` ausgeliefert. Für Projekt-Übersicht, Architektur
und Deployment → siehe Dokumentation im **Repo-Root** (`../docs/`).

## Lokale Entwicklung

```bash
cp .env.example .env.local   # bei Bedarf anpassen (Defaults reichen für lokale Entwicklung)
pnpm install
pnpm dev                     # http://localhost:3000 → /solax/configurator
```

`.env.example` ist die einzige authoritative Quelle für Env-Variablen des Builds.
Laufzeit-Einstellungen (E-Mail, Captcha, Rate-Limit) werden im WP-Admin konfiguriert.

## Build (Static Export)

```bash
pnpm build   # Prebuild validiert Hersteller-Daten, dann Next.js Static Export → out/
```

Danach `../wordpress-plugin/build/sync-konfigurator.sh` um das Bundle ins Plugin zu kopieren.

## Routen

| Route | Beschreibung |
|---|---|
| `/solax/configurator` | Konfigurator (Vollseite) |
| `/solax/embed` | iFrame-optimierte Variante |

## iFrame-Einbindung

```html
<iframe src="https://www.kw-baustoffe.de/pv-konfigurator/?route=embed"
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
| `../docs/DEPLOY.md` | Deployment-Workflow |
| `../docs/USER_MANUAL.md` | Für Dima: Einstellungen, Monitoring |
| `../docs/WORDPRESS.md` | WordPress-Plugin-Architektur |

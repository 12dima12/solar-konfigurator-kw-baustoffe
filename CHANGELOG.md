# Changelog

Format: [Semantic Versioning](https://semver.org/)

## [Unreleased]

## [2.5.4] – Hotfix: konfigurator-Seiten Hydration

### Fixed
- CSP-Header wurde bei `send_headers` mit `script-src 'self'` ausgeliefert,
  bevor der Shortcode-Render `CSP::allow_inline()` aufrufen konnte. Browser
  blockierte alle `self.__next_f.push(…)` Next.js-RSC-Inline-Scripts, React
  hydrierte nie → Buttons wie „Klassisches System" / „Alles in Einem IES"
  waren nicht klickbar. `CSP::send_csp()` erkennt die Konfigurator-Seite
  jetzt autark via `has_shortcode()` / `has_block()` auf dem Main-Post zum
  richtigen Hook-Zeitpunkt.

### Changed (Batch A — review fix-up)
- Provider-System für Captcha auf Altcha-only reduziert. hCaptcha und reCAPTCHA v3 entfernt inkl. PHP-Backend, Frontend-Widgets und NPM-Dependencies. Siehe `docs/DECISIONS.md` ADR-013.
- Shortcode-Asset-Rewriting umfasst jetzt auch `<img>`/`<link>` im Body-Markup — Produktbilder laden endlich aus dem Plugin-URL (vorher 404).
- PDF-Generation vollständig entfernt: `app/src/lib/pdf.tsx`, `@react-pdf/renderer` aus `package.json`. Der PDF-Versand war seit der Phase-10-Migration (Static Export + WP-Plugin) funktional tot, wurde aber weiterhin in Docs und README versprochen. Die Benachrichtigungs- und Bestätigungs-Mails sind reine HTML-Mails via `wp_mail()`.
- `post-export.mjs` scannt Manufacturer-Verzeichnisse dynamisch statt SolaX hardcoded.

### Fixed (previous)
- CSP: `strict-dynamic` entfernt (blockierte ohne Hashes alle Scripts).
- CSRF-Schutz via Origin-Check auf `/submit`.
- Altcha-Replay-Schutz via Transient-Fingerprint.
- Rate-Limiter atomisiert (`START TRANSACTION` + `SELECT … FOR UPDATE`).
- Honeypot-Check vor Rate-Limit und Validation.
- Path-Traversal-Guard in `Assets::extract_asset_tags()`.

## [2.1.0] – 2026-04-20 (vormals getaggt v2.1.0)
- Phase-11-Meilenstein: UX & Ops (siehe `PHASE_10_DONE.md`, `readme.txt`).

## [1.0.0] – 2026-04-20

### Added
- Initial Release: SolaX-Konfigurator (Wechselrichter, Backup, Batterie, Wallbox)
- Multi-Hersteller-Architektur (SolaX als erster Hersteller, Registry für weitere)
- Security-Hardening (CSP, Rate-Limit, hCaptcha, Honeypot, Input-Sanitization)
- CI-Pipeline (GitHub Actions: validate + vitest + data-tests + build)
- Vollständige Dokumentation (ONBOARDING, ARCHITECTURE, DECISIONS, ADD_MANUFACTURER, SECURITY, FAQ, USER_MANUAL, DEPLOY)
- PDF-Export mit KW-Branding (@react-pdf/renderer)
- E-Mail-Integration (Resend, Vertrieb + Kunden-Bestätigung)
- iFrame-Embedding mit postMessage-Resize
- 3-sprachig (DE/EN/CS)
- 68 Daten-Tests (Node.js, datenbasiert)
- Passwort-Schutz (Staging-Phase)

## [0.x.x] – Prä-1.0.0
Iterative Entwicklung (Phasen 0–6), siehe Git-History.

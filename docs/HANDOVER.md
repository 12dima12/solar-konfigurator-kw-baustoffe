# Projekt-Übergabe: KW PV Konfigurator

**Stand:** Phase 4 abgeschlossen  
**Auftraggeber:** Dima / KW Baustoffe GmbH / KW PV Solutions UG

---

## Was ist fertig

| Komponente | Status |
|---|---|
| Produktdaten-Extraktion (Phase 1) | ✓ vollständig |
| Datenmodell + Business Rules (Phase 2) | ✓ vollständig |
| Next.js Konfigurator-App (Phase 3) | ✓ baut fehlerfrei |
| PDF-Export (A4, KW-Branding) | ✓ implementiert |
| E-Mail via Resend (mit PDF-Anhang) | ✓ implementiert, Resend-API-Key fehlt |
| Submit-Formular (Name, E-Mail, Telefon) | ✓ vollständig |
| iFrame-Resize postMessage | ✓ vollständig |
| Mehrsprachigkeit DE/EN/CS | ✓ vollständig |
| Stock-Anzeige (rot/gelb/grün) | ✓ vollständig |
| Parallel-Tests (Datenintegrität) | ✓ 68/68 pass |
| Security-Checkliste | ✓ dokumentiert |
| Deployment-Anleitung | ✓ dokumentiert |

## Was Dima/Webmaster noch tun muss

### Vor dem ersten Deployment (Staging)

1. **Resend-Konto anlegen** — https://resend.com, Domain `kw-baustoffe.de` verifizieren
2. **`.env.local` erstellen** (in `app/`):
   ```
   RESEND_API_KEY=re_xxxxx
   SALES_EMAIL=vertrieb@kw-baustoffe.de
   FROM_EMAIL=konfigurator@kw-baustoffe.de
   ```
3. **Deployment testen** — `cd app && vercel` (Staging)
4. **iFrame-Test** — `tests/iframe-host.html` lokal öffnen

### Vor dem Produktiv-Deployment

5. **Produktbilder-Lizenz klären** — SolaX Media-Kit anfragen (siehe `docs/LEGAL.md`)
6. **postMessage-Origin einschränken** (siehe `docs/SECURITY.md`)
7. **DNS-Eintrag** für `konfigurator.kw-baustoffe.de` setzen
8. **E-Mail-Bestätigung testen** — Testformular absenden, E-Mail und PDF prüfen

### Optional (empfohlen)

9. **Backup-Filterung X1/X3** implementieren (OQ-1, `analysis/OPEN_QUESTIONS.md`)
10. **Rate-Limiting** aktivieren (upstash, 5 Anfragen/Stunde je IP)

## Wartungsaufwand

- **Produktdaten aktualisieren:** 15 Min, quartalsweise (Skript vorhanden)
- **Neue SolaX-Produkte:** JSON ergänzen + Deploy
- **Security-Updates:** `pnpm update` + Build + Deploy

## Phase 5+ Roadmap

| Phase | Inhalt | Aufwand |
|---|---|---|
| 5 | Weitere Hersteller (Fronius, Huawei, GoodWe) | 2-4 Tage |
| 6 | CRM-Anbindung (Lexware / Openhandwerk) | 1-2 Tage |
| 7 | Preiskalkulation + automatische PDF-Angebote | 2-3 Tage |
| 8 | A/B-Testing UX-Varianten | 1 Tag |

## Lizenz- und Rechtestatus

Siehe `docs/LEGAL.md` — Zusammenfassung:
- Code: 100% neu, kein Original-Code
- Daten (Produktfakten): frei nutzbar
- Produktbilder: vor Produktion klären
- Verantwortung: Dima / KW Baustoffe GmbH

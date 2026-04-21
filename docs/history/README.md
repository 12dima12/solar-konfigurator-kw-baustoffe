# History

Status-Reports der abgeschlossenen Projektphasen. **Nicht als aktuelle
Dokumentation lesen** — die Phase-Docs beschreiben den Stand *zum Zeitpunkt
ihrer Entstehung* und sind teils widersprüchlich zu späteren Phasen.

Wer sehen will, wie das Projekt geworden ist, liest:

- `../ARCHITECTURE.md` — aktueller Stand
- `../DECISIONS.md` — ADRs in chronologischer Ordnung
- `../../CHANGELOG.md` — Release-Historie

## Übersicht der Phasen

| Phase | Hauptthema                         | Datei                     |
|-------|------------------------------------|---------------------------|
| 0     | Sanity Check (Original analysieren) | `PHASE_0_DONE.md`         |
| 1     | Daten-Extraktion                    | `PHASE_1_DONE.md`         |
| 2     | Datenanalyse + Business Rules       | `PHASE_2_DONE.md`         |
| 3     | Clean-Room-Rebuild (Next.js + shadcn) | `PHASE_3_DONE.md`       |
| 4     | QA + Testing + Deploy-Doku          | `PHASE_4_DONE.md`         |
| 5     | Multi-Hersteller-Architektur        | `PHASE_5_DONE.md`         |
| 6     | Security-Hardening (Phase-6-Snapshot, viele Annahmen überholt) | `PHASE_6_DONE.md` |
| 7     | Developer Experience + Handover     | `PHASE_7_DONE.md`         |
| 8     | (kein _DONE.md — siehe Git-Log: Migration zu Altcha, Staging-Password-Entfernung) | — |
| 9     | Static Export                       | `PHASE_9_DONE.md`         |
| 10    | WordPress-Plugin `kw-pv-tools`      | `PHASE_10_DONE.md`        |
| 11    | UX & Ops (Submissions-Log, Auto-Update-Checker, …) — kein separates _DONE.md | — |

`PROJEKT_ABSCHLUSS.md` ist der Status-Report aus der Zeit von Phase 4 —
bewahrt, beschreibt aber einen längst abgelösten Stack (Vercel + Resend).

Ab v2.1 gibt es **keine** Phase-DONE-Dokumente mehr; Review-Commit-Bodies
und CHANGELOG-Einträge übernehmen die Rolle.

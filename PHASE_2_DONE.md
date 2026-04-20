# Phase 2 – Datenanalyse Abgeschlossen

Alle Analyse-Dokumente liegen in `./analysis/`.

## Produkte pro Phase (aus products.json)

| Phase | Produkte | Baumtiefe | Besonderheit |
|---|---|---|---|
| inverter | 31 | 3-4 | X3 hat Varianten-Ebene; IES flacher |
| backup | 6 | 2 | X1/X3-Trennung nur per Name |
| battery | 3 | 1 | Flat map, kein product_code |
| wallbox | 8 | 4 | Anzahl → Leistung → Anschluss → Variante |
| accessory | 0 | - | Serverseitig leer |
| finish | 0 | - | Serverseitig leer |
| **Gesamt** | **48** | | (45 mit product_code, 3 battery-Labels) |

## Identifizierte Business Rules

- 9 dokumentierte Regeln (Navigation, Sortierung, Stock, Spezialfälle)
- 2 Contact-Nodes (> 30 kW, More than one Wallbox)
- 2 Terminierungs-Nodes ohne Produkt (Backup "No", Wallbox "No Charger")

## Kompatibilitätsregeln

- 0 explizite Constraints in den Rohdaten
- 1 implizite Regel: Backup X1 vs. X3 aus Produktnamen ableitbar
- 3 offene Kompatibilitätsfragen (OQ-1, OQ-5, OQ-6)

## Datenqualität

- Keine Duplikate, kein kaputtes UTF-8
- 8 Produkte mit stock=0+ordered=0 (vollständig ausgelistet)
- 2 HTML-Info-Felder mit Tailwind-Klassen
- 4 kleinere Tippfehler im Original (dokumentiert)

## Offene Fragen für Phase 3

8 offene Fragen, kritisch für Phase 3:

1. **OQ-3 (kritisch):** Submit-Endpoint unbekannt → eigene API-Route bauen
2. **OQ-1 (mittel):** Backup-Filterung X1/X3 implementieren?
3. **OQ-4 (niedrig):** accessory/finish → als Platzhalter oder weglassen?

Alle Details: `./analysis/OPEN_QUESTIONS.md`

## Empfehlung

**Phase 3 kann beginnen.** Alle Datenmodelle sind vollständig dokumentiert.
Kritischer Blocker (OQ-3, Submit-Endpoint) kann in Phase 3 als eigene API-Route gelöst werden
ohne Rückgriff auf das Original.

## Nächster Schritt
Warte auf Freigabe von Dima zur Ausführung von Phase 3.

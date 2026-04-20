# Datenqualitäts-Report

## Produkte ohne product_code

| Phase | Situation |
|---|---|
| battery | gesamte Phase — nur Label-Strings, keine product_codes |
| inverter > 30 kW | kein Produkt, Contact-Node |
| backup "No" | kein Produkt, Terminierungs-Node |
| wallbox "No Charger" | kein Produkt, Terminierungs-Node |
| wallbox "More then one" | kein Produkt, Contact-Node |

## Produkte mit stock = 0 (nicht verfügbar, keine Nachbestellung)

Diese 8 Produkte haben `totalAvailable: 0` UND `totalOrdered: 0` — vollständig ausgelistet:

| Phase | product_code | product_name |
|---|---|---|
| inverter | G-21s-6374 | Solax G4 X1-Hybrid-3.7-D, WiFi 3.0, CT |
| inverter | G-21s-6504 | Solax G4 X1-Hybrid-5.0-D, WiFi 3.0, CT |
| inverter | G-21s-3H15 | Solax X3 ULT-15K, WiFi+LAN, CT, (2xMPP) |
| inverter | G-21s-3H20 | Solax X3 ULT-20K, WiFi+LAN, CT, (2xMPP) |
| inverter | G-21s-3H25 | Solax X3 ULT-25K, WiFi+LAN, CT |
| inverter | G-21s-3H30 | Solax X3 ULT-30K, WiFi+LAN, CT |
| inverter | G-21d-3I60 | Solax X3-IES-6.0K, WiFi+LAN, CT |
| backup | G-210-303d | Solax X1-Matebox Advanced, D |

**Empfehlung:** Im Rebuild trotzdem anzeigen (mit "Nicht verfügbar"-Badge), nicht ausblenden.
Diese Produkte erscheinen im Original-Konfigurator ebenfalls.

## Duplikate

**Keine Duplikate** — alle product_codes sind eindeutig über alle Phasen hinweg.

## Sprachkonsistenz

- **Inverter:** DE/EN/CS identisch (31 product_codes je Sprache) ✓
- **Backup:** DE/EN/CS identisch (6 product_codes je Sprache) ✓
- **Wallbox:** DE/EN/CS identisch (8 product_codes je Sprache) ✓
- **Battery:** alle Sprachen identisch (flat tree, nur Labels) ✓

Übersetzungen betreffen nur `label`, `description`, `title`, `product_name` — 
alle Strukturen sind sprachunabhängig gleich.

## Tippfehler / Inkonsistenzen in den Daten

| Feld | Wert | Problem |
|---|---|---|
| wallbox.tree key | `"More then one"` | Sollte "More **than** one" sein |
| wallbox.title | `"Wahlen Sie..."` | Fehlender Umlaut: "Wählen Sie..." |
| wallbox.title | `"Steckdose oder Stecker"` (DE) vs `"Buchse oder Kabel"` (DE) | Inkonsistente Terminologie |
| backup product_name | `"Solax X1-Matebox Advanced, D "` | Trailing Leerzeichen |

## Nicht-UTF-8 Zeichen

Keine gefunden — alle Dateien sind valides UTF-8.

## HTML in Datenfeldern

Folgende Felder enthalten rohe HTML-Strings (Tailwind-Klassen aus dem Original):
- `backup.tree.Yes.children["X3 EPS Box"].info`
- `backup.tree.Yes.children["X3 Matebox Advanced"].info`
- `inverter.tree["Split System"].children["Single-phase inverter X1"].description` (einige Nodes)

**Empfehlung:** Im Rebuild mit DOMPurify sanitizen und eigene CSS-Klassen mappen.

# Phase 1 – Daten-Extraktion Abgeschlossen

Siehe Details: `./recon/summary.md`, `./recon/inventory.md`, `./recon/validation.md`

## Ergebnis

**12 von 18 JSON-Dateien valide** (6 leere Konfiguratoren: accessory + finish existieren serverseitig nicht).

### Aktive Konfiguratoren (4 von 6)
| Konfigurator | Produkte | Baumtiefe | Sprachen |
|---|---|---|---|
| inverter | 31 | 10 | de/en/cs |
| backup | 6 | 6 | de/en/cs |
| battery | 3 | 2 | de/en/cs |
| wallbox | 8 | 10 | de/en/cs |

### Erste 20 Produktnamen (inverter_de)
10.0 kW
12.0 kW
15.0 kW
20.0 kW
25.0 kW
30.0 kW
5.0 kW
6.0 kW
8.0 kW
Bitte kontaktieren Sie Ihren Vertriebsmitarbeiter oder unseren Support. SolaX hat die Lösung.
IES
IES 10.0 kW AFCI
IES 12.0 kW AFCI
IES 15.0 kW AFCI
IES 4.0 kW AFCI
IES 5.0 kW AFCI
IES 6.0 kW
IES 6.0 kW AFCI
IES 8.0 kW AFCI
Single-phase inverter X1

## Assets
- 17 Produktbilder + 2 Cover-Bilder = 20 Dateien lokal
- CSS (65 KB), HTML (8 KB) lokal
- Keine JS-Bundle-Referenzen im HTML gefunden (vermutlich inline oder als Modul)

## Besonderheit: Produktbaum-Struktur
Der Baum verwendet **benannte Objekt-Keys** statt Arrays — kein `product_code`-Feld,
stattdessen ist `.value` der Produktname/Code. Phase 2 muss dies beim Normalisieren berücksichtigen.

## Empfehlung
**Phase 2 bereit.** Alle relevanten Produktdaten liegen vor. Die 6 leeren Konfiguratoren
(accessory, finish) sind im Konfigurator zwar referenziert (via `configuratorNext`),
aber serverseitig noch nicht befüllt — im Rebuild als "Schritt folgt" implementieren.

## Nächster Schritt
Warte auf Freigabe von Dima zur Ausführung von Phase 2.

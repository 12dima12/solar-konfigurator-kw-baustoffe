# Business Rules

## 1. Navigations-Logik

Der Konfigurator durchläuft Phasen sequentiell gemäß `configuratorNext`:
```
inverter → backup → battery → wallbox → accessory → finish
```

**State-Repräsentation:** `steps[]` Array von ausgewählten Tree-Keys (Navigations-Pfad).
Beispiel: `["Split System", "Single-phase inverter X1", "5.0 kW"]`

**Progress:** `steps.length / maxDepth` (Baumtiefe je Phase variiert).

**Abschluss:** `finish`-Phase triggert POST-Submit mit dem vollständigen `steps[]`.

---

## 2. Inverter-Besonderheiten

### IES-Typ (2 Ebenen)
- Pfad: `IES → <kW-Auswahl>`
- Direkte Produktauswahl nach Leistung
- Hat `cover`-Bild (Titelbild-Karte)
- Alle IES-Produkte haben AFCI-Varianten

### Split System X1 (3 Ebenen)
- Pfad: `Split System → Single-phase inverter X1 → <kW>`
- Nur SolaX Hybrid G4, 1-phasig
- Eine Produktvariante pro Leistungsstufe

### Split System X3 (4 Ebenen)
- Pfad: `Split System → Three-phase inverter X3 → <kW> → <product_code>`
- Mehrere Varianten pro Leistungsstufe (z.B. -D vs. -P Modelle)
- Leistungsbereich: 5.0 – 30.0 kW

### Sonderfall > 30.0 kW
- Kein Produkt-Leaf, stattdessen Info-Message:
  `"Bitte kontaktieren Sie Ihren Vertriebsmitarbeiter oder unseren Support."`
- `value` enthält den Info-Text (kein `product_code`)
- Im Rebuild: eigene `ContactCard`-Komponente statt Produktkarte

---

## 3. Sortierung & Gruppierung

- **Sortierung:** aufsteigend nach `priority` (1 = höchste Priorität)
- Keys ohne `priority`: behandle als 999 (Ende der Liste)
- **Gruppierung:** `group`-Feld (nur inverter), z.B. `"SolaX Hybrid Ultra"`, `"Solax Hybrid G4"`
- Innerhalb einer Gruppe: weitere Sortierung nach `priority`

Prioritäten-Beispiele:
- `priority: 1` → erster Eintrag
- `priority: 99` → fast am Ende
- `priority: 101, 102, ...` → absolute Reihenfolge

---

## 4. Stock-Logik

| Bedingung | Anzeige | Farbe |
|---|---|---|
| `totalAvailable === 0 && totalOrdered === 0` | "Nicht verfügbar" | Rot |
| `totalAvailable === 0 && totalOrdered > 0` | "Unterwegs: X Stück" | Gelb |
| `totalAvailable < 10` | "Nur noch X verfügbar" | Gelb |
| `totalAvailable >= 10` | "Verfügbar" | Grün |
| `totalAvailable > 1000` | "> 1000 Stück" | Grün |

Wenn `totalOrdered > 0`: Zusatzinfo immer anzeigen, unabhängig von `totalAvailable`.

---

## 5. Backup-Phase Besonderheit

- `backup.tree.No` ist ein terminaler Knoten (kein `product_code`, kein `children`)
- `value: null` — wenn Nutzer "Nein" wählt, wird kein Produkt zum Warenkorb hinzugefügt
- Die Phase wird übersprungen/terminiert ohne Produkt-Auswahl
- Im Rebuild: "Nein" führt direkt zur nächsten Phase (battery)

---

## 6. Battery-Phase Besonderheit

- `battery.tree` ist ein flaches `Record<string, string>` — keine Node-Objekte
- Kein `product_code`, kein `stock`, keine Bilder
- Aktuell nur 3 Einträge: Triple Power S 25/S 36, T58, T30
- Im Rebuild: einfache Button-Liste ohne Lagerinfo

---

## 7. Icon-System

Icons sind Font Awesome 6 Klassen mit Tailwind-Farbklassen:
- `"fa-solid fa-bolt text-yellow-500"` (Inverter-Strom)
- `"fa-solid fa-check text-green-500"` (Ja-Auswahl)
- `"fa-solid fa-xmark text-red-500"` (Nein-Auswahl)
- `"fa-solid fa-1 text-blue-500"` (Wallbox: eine)
- `"fa-solid fa-plug-circle-bolt text-purple-700"` (Socket)
- `"fa-solid fa-charging-station text-blue-500"` (Plug)

Im Rebuild: Font Awesome durch eigenes Icon-System oder Heroicons ersetzen.

---

## 8. Info-HTML

Das `info`-Feld enthält rohes HTML (nicht sanitized):
```html
<h2 class='text-lg mb-4 pb-2 border-b-2 border-gray-500'>X3 Matebox Advanced</h2>
<p>- Vorinstalliert<br>- Automatisierte Backup-Schaltbox...</p>
```

Die CSS-Klassen sind Tailwind-Klassen aus dem Original. Im Rebuild: eigene Klassen verwenden
oder `dangerouslySetInnerHTML` mit sanitization (z.B. DOMPurify).

---

## 9. Wallbox "No Charger" Option

- `tree["No Charger"]` ist ein direkter Leaf ohne children (ähnlich wie backup "No")
- Kein Produkt wird hinzugefügt, Phase wird übersprungen

# Datenstruktur-Schema

## Gemeinsame Felder je Node-Typ

### Kategorie-Node (Zwischenebene, hat `children`)
| Feld | Typ | Required | Vorkommen |
|---|---|---|---|
| `value` | string | ja | alle außer battery |
| `label` | string | ja | alle außer battery |
| `title` | string\|null | nein | alle außer battery |
| `icon` | string\|null | nein | Font Awesome class, z.B. `"fa-solid fa-bolt text-yellow-500"` |
| `description` | string\|null | nein | alle |
| `image` | string\|null | nein | relativer Pfad, z.B. `"img/IES.png"` |
| `cover` | string\|null | nein | nur inverter (IES, Split System) |
| `info` | string\|null | nein | html-String oder null |
| `children` | Record<string, Node> | ja | enthält Keys als Navigations-Pfad |

### Produkt-Node (Blatt, kein `children`)
| Feld | Typ | Required | Vorkommen |
|---|---|---|---|
| `product_code` | string | ja | alle außer battery |
| `product_name` | string | ja | vollständiger Handelsname |
| `value` | string | ja | Anzeigename (oft kürzer als product_name) |
| `label` | string | ja | Leistung oder Variantenbezeichnung |
| `stock` | StockInfo | ja | alle außer battery |
| `priority` | number | ja | Sortiergewicht (1 = höchste) |
| `image` | string\|null | nein | Produktbild |
| `description` | string\|null | nein | Kurzbeschreibung |
| `info` | string\|null | nein | HTML-Info-Block |
| `power` | number | nein | nur inverter (kW als Zahl) |
| `type` | string | nein | nur inverter (z.B. `"SolaX Hybrid G4"`) |
| `group` | string\|null | nein | nur inverter (z.B. `"SolaX Hybrid Ultra"`) |

### StockInfo
```json
{ "totalAvailable": 101, "totalOrdered": 40 }
```

## Spezialfall: battery
`battery.tree` ist ein flaches `Record<string, string>` — kein Node-Objekt:
```json
{ "Triple Power S 25/S 36": "Triple Power S 25/S 36", ... }
```
Kein `product_code`, kein `stock`. Die Batterien sind aktuell reine Auswahl-Labels ohne Details.

## Spezialfall: Metadaten auf Root-Ebene
| Feld | Vorkommen |
|---|---|
| `configuratorId` | alle — z.B. `"inverter"`, `"battery"` |
| `configuratorNext` | alle — nächste Phase, z.B. `"backup"` |
| `titlesByPath` | alle — Fragen-Text je Pfad, z.B. `{"": "Montagetyp"}` |
| `dynamicTitles` | battery (leer) |
| `iconsByPath` | battery (leer) |
| `imagesByPath` | battery (leer) |
| `descriptionsByPath` | battery (leer) |

## Inverter-Baumstruktur (3 Ebenen)
```
tree
├── IES                          ← Kategorie-Node (cover-Bild)
│   ├── "4.0 kW"                 ← Produkt-Leaf (product_code, stock, power)
│   ├── "5.0 kW"
│   └── ...
└── Split System                 ← Kategorie-Node (cover-Bild)
    ├── Single-phase inverter X1 ← Kategorie-Node (icon, title)
    │   ├── "3.0 kW"             ← Produkt-Leaf
    │   └── ...
    └── Three-phase inverter X3  ← Kategorie-Node
        ├── "5.0 kW"             ← Produkt-Leaf
        ├── "> 30.0 kW"          ← Spezial-Node (kein Produkt, Info-Message)
        └── ...
```

## Backup-Baumstruktur (2 Ebenen)
```
tree
├── No  ← Leaf (kein children)
└── Yes ← Kategorie-Node
    ├── "X1 Matebox Advanced" ← Produkt-Leaf
    ├── "X3 Matebox G2"
    └── ...
```

## Wallbox-Baumstruktur (4 Ebenen)
```
tree
├── One / More then one / No Charger ← Anzahl-Kategorie
    └── Power 11 / Power 22          ← Leistungs-Kategorie
        └── Socket / Plug             ← Anschluss-Kategorie
            └── Standard / With display ← Produkt-Leaf
```

## Unterschiede zwischen Konfigurations-Phasen
| Feld | inverter | backup | battery | wallbox |
|---|---|---|---|---|
| `cover` | ✓ | - | - | - |
| `power` | ✓ | - | - | - |
| `type` | ✓ | - | - | - |
| `group` | ✓ | - | - | - |
| `icon` (FA) | ✓ | ✓ | - | ✓ |
| `stock` | ✓ | ✓ | - | ✓ |
| `priority` | ✓ | ✓ | - | ✓ |
| Baumtiefe | 3 | 2 | 1 (flach) | 4 |

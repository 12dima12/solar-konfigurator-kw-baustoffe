# Kompatibilitätsmatrix

## Inverter ↔ Backup

Der Konfigurator trennt Backup-Produkte **nicht** nach Inverter-Typ — alle 6 Backup-Produkte
erscheinen unabhängig vom gewählten Wechselrichter. Die Kompatibilität ist implizit
aus den Produktnamen ableitbar:

| Backup-Produkt | product_code | Kompatibel mit | Belegt durch |
|---|---|---|---|
| X1 Matebox Advanced | G-210-303d | X1 (1-phasig) | Produktname "X1-" |
| X1 EPS Box | B-210-10061 | X1 (1-phasig) | Produktname "X1-" |
| X3 Matebox G2 | G-210-503m | X3 (3-phasig) | Produktname "X3-" |
| X3 Matebox Advanced | G-210-405dd | X3 (3-phasig) | Produktname "X3-" |
| X3 EPS Box | B-210-1006 | X3 (3-phasig) | Produktname "X3-" |
| X3 EPS PBOX 60 kW | B-210-10081 | X3 IES / Ultra | Produktname "X3-" + 60kW |

**OFFEN:** Das Original-Frontend filtert vermutlich nach gewähltem Inverter-Typ (X1 vs. X3).
Diese Filterlogik ist im Backend-JSON nicht codiert — sie muss im Frontend implementiert werden.

## Empfohlene Rebuild-Logik

```typescript
function filterBackupProducts(inverterPath: string[], backupProducts: FlatProduct[]): FlatProduct[] {
  const isX1 = inverterPath.includes("Single-phase inverter X1") || inverterPath.includes("IES");
  const isX3 = inverterPath.includes("Three-phase inverter X3") || inverterPath.includes("IES");
  
  // IES ist 3-phasig (X3-kompatibel)
  // X1 = einphasig → nur X1-Produkte
  // X3 / IES = dreiphasig → nur X3-Produkte
  
  return backupProducts.filter(p => 
    isX1 ? p.product_name.includes("X1-") : p.product_name.includes("X3-")
  );
}
```

## Battery ↔ Inverter

Kein Kompatibilitäts-Mapping im JSON vorhanden. Alle 3 Triple Power Modelle erscheinen
für alle Inverter-Typen. Aus dem SolaX-Produktkatalog (extern recherchieren):
- Triple Power S 25/S 36: kompatibel mit X1/X3 Hybrid
- Triple Power T58: kompatibel mit X3 Ultra
- Triple Power T30: kompatibel mit X1/X3 Hybrid

**OFFEN:** Keine Kompatibilitäts-Constraints in den Rohdaten.

## Wallbox ↔ Inverter

Keine Kompatibilitätsbeschränkung — alle Wallbox-Optionen erscheinen unabhängig
vom Inverter-Typ. Die HAC Wallboxen sind mit allen SolaX-Wechselrichtern kompatibel
(Energie-Management via SolarEdge/SolaX Smart Meter).

## Zusammenfassung

| Paar | Constraint im JSON | Filterung nötig |
|---|---|---|
| Inverter ↔ Backup | ✗ nicht codiert | Ja (X1 vs. X3) |
| Inverter ↔ Battery | ✗ nicht codiert | Empfohlen |
| Inverter ↔ Wallbox | ✗ nicht codiert | Nein |
| Backup ↔ Battery | ✗ nicht codiert | Nein |

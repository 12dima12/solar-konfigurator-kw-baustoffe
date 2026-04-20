# Phase 1 – Extraction Summary

**Zeitpunkt:** 2026-04-20T18:53:26+02:00

## Daten
- JSON-Dateien erwartet: 18
- JSON-Dateien tatsächlich: 18
- Validierung bestanden: 12
- Nicht verfügbar (leere Configs): accessory (de/en/cs), finish (de/en/cs) → Meldung "Konfigurační data neexistují"

## Aktive Konfiguratoren
- inverter: 31 unique Produkte, Baumtiefe 10
- backup: 6 unique Produkte, Baumtiefe 6
- battery: 3 Produkte (Flachbaum, Tiefe 2)
- wallbox: 8 unique Produkte, Baumtiefe 10

## Assets
- Bildpfade extrahiert: 17
- Bilder heruntergeladen: 20
- CSS-Größe: 65720 Bytes
- HTML-Größe: 7987 Bytes

## Fehler
WARNING: accessory_de failed (HTTP 200, 32 bytes)
WARNING: accessory_en failed (HTTP 200, 32 bytes)
WARNING: accessory_cs failed (HTTP 200, 32 bytes)
WARNING: finish_de failed (HTTP 200, 32 bytes)
WARNING: finish_en failed (HTTP 200, 32 bytes)
WARNING: finish_cs failed (HTTP 200, 32 bytes)

## Nächste Schritte
- Review durch Dima: Sind alle 12 validen JSON-Dateien vollständig?
- Produktinventar plausibel? (siehe inventory.md)
- Bilder vollständig?
- Falls OK: Freigabe für Phase 2 einholen

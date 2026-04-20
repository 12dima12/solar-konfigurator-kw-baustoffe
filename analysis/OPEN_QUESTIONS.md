# Offene Fragen für Phase 3

## OQ-1: Backup-Filterung nach Inverter-Typ
**Problem:** Der Konfigurator zeigt alle 6 Backup-Produkte unabhängig vom gewählten Wechselrichter.
Ob das Original-Frontend nach X1/X3 filtert, ist aus dem HTML nicht eindeutig erkennbar.
**Entscheidung nötig:** Filterung im Rebuild implementieren (X1-Produkte nur für X1-Inverter)?
**Empfehlung:** Ja, X1/X3-Filterung basierend auf Produktnamen implementieren.

## OQ-2: Battery-Phase ohne Produktdetails
**Problem:** `battery.tree` liefert nur Label-Strings ohne product_code, stock oder Bilder.
**Entscheidung nötig:** Batteriebilder und Codes selbst recherchieren und hardcoden?
**Empfehlung:** Phase als "Auswahl ohne Lagerinfo" implementieren, eigene Produktbilder anlegen.

## OQ-3: Submit-Endpoint
**Problem:** Der POST-Endpoint nach `finish`-Phase ist unbekannt.
Es wurde kein JS-Bundle gefunden (0 `src=...js`-Refs im HTML).
**Action:** JS-Source aus dem gerenderten HTML manuell extrahieren oder Network-Tab analysieren.
**Für Rebuild:** Eigener Submit-Endpoint (z.B. WordPress REST API oder Next.js API Route).

## OQ-4: accessory + finish Phasen
**Problem:** Beide Phasen liefern "Konfigurační data neexistují" — keine Daten vorhanden.
**Entscheidung nötig:** Im Rebuild als "Coming Soon" oder ganz weglassen?
**Empfehlung:** Phasen vorerst überspringen, Konfigurationskette bei wallbox enden lassen.

## OQ-5: Battery-Kompatibilität
**Problem:** Triple Power T58 ist laut SolaX-Datenblatt nur für X3 Ultra — aber im Konfigurator
nicht gefiltert. Im Rebuild auch ungefiltert lassen?
**Empfehlung:** Kompatibilitätsinformation aus SolaX-Datenblättern recherchieren.

## OQ-6: IES ist X3 oder eigene Kategorie?
**Problem:** IES-Wechselrichter sind 3-phasig (aus Produktnamen: "X3-IES"), aber im
Konfigurator-Baum als eigenständige Kategorie (nicht unter "Split System → X3").
**Entscheidung nötig:** Bei Backup-Filterung IES → X3-Backup-Produkte zuordnen?
**Empfehlung:** Ja, IES → X3-kompatibel.

## OQ-7: AFCI-Varianten
**Problem:** Manche IES-Modelle haben explizite AFCI-Varianten im Baum
(z.B. "6.0 kW" ohne AFCI und "6.0 kW AFCI" als eigene Keys).
Bei X3 nur: "G-21c-4208" vs "G-21d-4P08" — AFCI nicht in Key.
**Entscheidung nötig:** AFCI als separate Option oder eigene Variante?
**Empfehlung:** Wie im Original — AFCI als eigenen Auswahlpunkt.

## OQ-8: Sprache der UI
**Problem:** `titlesByPath[""]` für backup_de = "Benötigen Sie eine Ersatzstromversorgung..."
aber battery_en = "1) Select Battery" (englisch trotz lang=de).
**Empfehlung:** UI-Texte (Fragen, Buttons) im Rebuild hardcoden und separat übersetzen,
nicht aus `titlesByPath` beziehen.

# Changelog

Format: [Semantic Versioning](https://semver.org/)

## [Unreleased]

## [2.7.22] – 2026-04-25 – Zubehör-Karten mit Icons + Image-Preload

### Fixed
- **Smart-Meter- und Dongle-Karten ohne Icon** waren visuell flach und
  bei langen Produktnamen ("Solax Chint 3Ph Meter DTSU666") rutschte der
  Text über den Kartenrand. Jetzt links eine 32×32-Icon-Kachel
  (`Gauge` für Smart Meter, `Radio` für Dongle) mit primärer
  Akzent-Farbe für aktive Optionen und gedämpftem Grau für die
  "Kein …"-Opt-out-Karte. Karten-`min-h: 64px` für gleiche Höhen,
  Text bricht via `break-words`.
- **Produktbilder luden zu langsam.** Next.js Image nutzt per Default
  Lazy-Loading; auf einer Phase mit ~10 Cards bedeutete das ein
  sichtbares Reflow nach Phase-Wechsel. `priority` an den Bildern
  oberhalb des Folds:
  - `InstallationTypePicker.tsx` (zwei Cover-Bilder)
  - `BatteryConfigurator.tsx` (Serien-Thumbnails am Fuß)
  - `OptionCard.tsx` (jede Produkt-/Cover-Card im Grid)
  Next.js injiziert dadurch `<link rel="preload" as="image">` im Head
  und überspringt Lazy-Loading. Bei mobilen Verbindungen merkt der
  User: Phasenwechsel → Bilder sind sofort da.

## [2.7.21] – 2026-04-24 – "Meine Auswahl"-Panel UX + Inverter-Name im Battery-Header

### Fixed
- **"Meine Auswahl"-Panel Mobile-Padding**: Das Slide-Out-Panel
  (`CurrentSetupSidebar`) hatte horizontal kein Padding, Items
  klebten am Rand und überlappten mit dem 25 %-breiten transparenten
  Overlay links. Jetzt `px-5 py-4`-Innenabstand, Produktbild in
  48×48-Kachel mit hellem Hintergrund, Textspalten mit `break-words`
  statt `truncate` (auf Mobile sehen wir den ganzen Produktnamen).
- **Mobile-Breite**: Vorher `w-3/4` (75 %), jetzt `w-full` bis zum
  sm-Breakpoint, ab `sm` die bisherige `max-w-sm`-Begrenzung. Mobile
  füllt das Panel die volle Breite; Desktop bleibt wie gehabt.
- **Desktop-Scroll**: Beim Klick auf "Meine Auswahl" wird `scrollToTop()`
  abgefeuert → der Parent scrollt den iframe in den Viewport.
  Vorher: Panel öffnete, aber wer weiter unten im Theme gescrollt
  war, sah es nicht ohne selbst hochzuscrollen.
- **Batterie-Menü-Kopf zeigte Step-Key statt Produktname**. Der
  "Wechselrichter: …"-Zusatz las bisher `inverterSteps[last]`, was
  für eine Split-X3-Auswahl z.B. "Three-phase inverter X3" lieferte
  (interner Katalog-Key, kein Produktname). Jetzt primär
  `selections.inverter.selectedProduct.product_name` (echte
  Produktbezeichnung wie "Solax G4 X3-Hybrid-5.0-D, CT, ohne WiFi 3.0"),
  mit Step-Key als letzter Fallback. Bei AC-Kopplung bleibt die Zeile
  ausgeblendet, weil dort kein Inverter-Slot existiert.
  (`BatteryConfigurator.tsx:90-97,139-150`)

## [2.7.20] – 2026-04-24 – Wallbox-Rename + Deutsch-Sprach-Sweep

### Changed
- **Wallbox-Root-Option "Eine" umbenannt in "X3-HAC 11/22 kW"** in
  allen drei Locales. Der Kunde sieht jetzt auf einen Blick, welches
  Produkt hinter der Kachel steckt. Die Unterstruktur (11/22 kW →
  Buchse/Kabel → Standard/Mit Display) bleibt unverändert.

### Fixed
- **Batterie-Phase-Überschrift "1) Select Battery"** — englisches
  Alt-Relikt aus dem GBC-Katalog. Jetzt:
  - de: "Batterie auswählen"
  - en: "Select battery"
  - cs: "Vyberte baterii"
- **"(Strings)" in MPPT-Labels** der DE-Inverter (8/10/12/15/20 kW
  Hybrid/PRO-Varianten) → `(Stränge)`. 12 Einträge umgestellt.
- **Wallbox-Phase-Titel** für "Power 22" lautete "Steckdose oder
  Stecker", "Power 11" dagegen "Buchse oder Kabel". Jetzt überall
  einheitlich "Buchse oder Kabel" (de) / "Socket or Cable" (en) /
  "Zásuvka nebo kabel" (cs) — passt zur "Typ-2 Buchse" /
  "Typ-2 Kabel"-Beschriftung der Kindoptionen.

## [2.7.19] – 2026-04-24 – AC-Kopplung: Dongle + Smart Meter opt-in (Default = kein)

### Changed
- **`AccessoryConfigurator` Defaults hängen jetzt vom Installationsmodus ab.**
  - `installationType === "ac-coupling"`: `dongleKey = null` (→ "Kein
    Dongle"-Karte vorausgewählt), `meterKey = null` (→ "Kein Meter"
    vorausgewählt). Der Retrofit-Kunde muss aktiv etwas auswählen,
    bekommt nichts aufgedrängt.
  - Sonst (Neuinstallation): Defaults wie gehabt —
    `dongleKey = "dongle-wifi-lan"` und `meterKey = availableMeters[0]?.key`.
  (`AccessoryConfigurator.tsx:145-155`)

## [2.7.18] – 2026-04-24 – Smart Meter auch bei AC-Kopplung sichtbar

### Fixed
- **Smart-Meter-Abschnitt war bei AC-Kopplung leer**. Der Filter in
  `AccessoryConfigurator.tsx` leitete die Meter-Phase (X1 / X3) aus
  `selections.find((s) => s.phase === "inverter")?.steps` ab. Bei
  AC-Kopplung gibt es keinen Inverter-Slot, ergo `isX1 = isX3 = false`,
  `availableMeters = []`, und die Sektion verschwand. Fix: bei
  `installationType === "ac-coupling"` passieren beide Smart-Meter
  den Filter, der Kunde wählt den zu seiner bestehenden PV-Anlage
  passenden selbst. (`AccessoryConfigurator.tsx:130-137`)

## [2.7.17] – 2026-04-24 – Holding-Bracket-Default gedreht + AC-Kopplung Filter entfernt

### Fixed
- **Holding Bracket + Base Plate werden für aktuelle Batterie-Serien
  nicht mehr gezeigt** (IES HS50E-D und Triple Power S/T). Der User hat
  bestätigt, dass diese externen Montage-Teile nur für T-BAT H 5.8 V3
  (derzeit Teaser) vorgesehen sind; die heutigen Serien bringen ihre
  Montage im Gehäuse mit. Default von `usesMountingAccessories`
  umgedreht: jetzt opt-in per `true`, nicht opt-out per `false`. Nur
  `t-bat-h58-v3` hat das Flag aktiv; die anderen Serien bekommen die
  Komponenten-Auflistung im Zubehör-Schritt nicht mehr injiziert.
  (`battery-series.ts`, `AccessoryConfigurator.tsx:124`)
- **AC-Kopplung zeigt jetzt die volle Auswahl in Notstrom + Wallbox.**
  Der in v2.7.0 eingeführte AC-Kopplung-Compatibility-Filter in
  `solax/rules.ts` hat auf Basis von `compatibility: ["ac-coupling"]`-
  Tags aus dem Katalog sowie einer `"hac"/"retrofit"`-Heuristik gefiltert.
  Praktisches Ergebnis:
  - Notstrom-Phase zeigte nur "Nein" (weil "Ja" nur `compatibility:
    ["new"]` hatte).
  - Wallbox-Phase zeigte nur "Eine" (weil das `"HAC"` im Produktnamen
    die Heuristik triggerte), die "Kein Ladegerät"-Option fiel raus.
  Der User möchte in AC-Kopplung selbst entscheiden; Filter komplett
  deaktiviert. Katalog-Tags `compatibility` und die
  `supportsInstallationType`-Funktion bleiben als Metadata für
  spätere Feinjustierung erhalten.

### Changed
- `BatterySeries.usesMountingAccessories` ist jetzt ein Opt-in-Flag
  (Default-Semantik: `false`). Dokumentiert im JSDoc-Kommentar.

## [2.7.16] – 2026-04-24 – Render-Loop-Fix in AC-Kopplung

### Fixed
- **React-Error #185 "Maximum update depth exceeded" beim Wechsel in
  AC-Kopplung**. Die ErrorBoundary aus v2.7.15 hat den Crash
  strukturiert sichtbar gemacht; der Stacktrace zeigte auf einen
  Render-Loop. Ursache: der Zustand-Selector in `BatteryConfigurator`
  ```ts
  useConfigStore((s) => s.selections.find(
    (sel) => sel.phase === "inverter"
  )?.steps ?? []);
  ```
  fiel bei AC-Kopplung immer auf den Fallback `?? []`, weil die
  Selections-Kette dort **keinen** `"inverter"`-Slot enthält
  (`["battery","backup","wallbox","accessory"]`). Jeder Aufruf
  erzeugte ein **neues** leeres Array, Zustand verglich die Referenz
  per `Object.is` und triggerte einen Re-Render. Der nächste Render
  rief den Selector wieder auf, neue Referenz, nächster Re-Render, …
  bis React mit #185 abbricht. In "Neue Installation" gab es den Loop
  nicht, weil dort die Inverter-Selection den Selector auf eine
  stabile `.steps`-Referenz führte.
- Fix: Modul-Level-Konstante `EMPTY_STEPS: string[] = []` als stabile
  Leer-Referenz im Fallback. Zustand erkennt Referenzgleichheit und
  beendet die Render-Schleife. (`BatteryConfigurator.tsx:61,89`)

## [2.7.15] – 2026-04-24 – iOS-iframe-Crash bei AC-Kopplung + ErrorBoundary

### Fixed
- **"This page couldn't load" auf iOS Safari nach Klick auf
  AC-Kopplung**: Der `InstallationTypePicker` feuerte `scrollToTop()`
  synchron im gleichen Event-Handler wie `setInstallationType()`. In
  Kombination mit dem Höhensprung (Picker ca. 400 px → Battery-
  Konfiguration ca. 1200 px) und dem ResizeObserver-getriggerten
  postMessage an das Parent-Fenster konnte iOS den iframe reclaimen.
  `scrollToTop` läuft jetzt in einem `setTimeout(..., 60)` — nach dem
  Re-Render und dem ersten Resize-Event ist der iframe wieder stabil.
  (`ConfiguratorShell.tsx:167`)

### Added
- **`ConfiguratorErrorBoundary`** in
  `app/src/components/configurator/ErrorBoundary.tsx`. Fängt
  unerwartete React-Fehler innerhalb des Konfigurators ab und zeigt
  einen strukturierten Fehlerdialog mit Reload-Button + `<details>`-
  Block für technische Details (Error-Message). Verhindert, dass ein
  Crash in einer Teilkomponente den gesamten iframe weiß rendern
  lässt — iOS Safari interpretiert weißen iframe-Content gelegentlich
  als Navigation-Failure ("This page couldn't load"). Wrapper ist in
  beiden Entry-Points (`/embed`, `/configurator`) aktiv.

## [2.7.14] – 2026-04-24 – AC-Kopplung: Reihenfolge mit Backup + IES-Batterie

### Changed
- **AC_COUPLING_PHASES** von `["battery","wallbox","accessory"]` auf
  `["battery","backup","wallbox","accessory"]` erweitert. Der Backup-
  Schritt wird wieder gezeigt, steht aber hinter der Batterie (beim
  Retrofit ist die Speicherwahl die zentrale Kauf-Entscheidung; der
  Notstrom-Optionstyp kommt nachgelagert). Der existierende
  `compatibility`-Filter in `solax/rules.ts` schränkt die Optionen
  in AC-Kopplung weiter auf "Kein Notstrom" ein.
- **`BatteryConfigurator` im AC-Kopplung-Modus zeigt alle Serien**
  (IES HS50E-D + Triple Power S2.5/S3.6/T30/T58), nicht mehr nur
  die Split-scope. Der `isIES`-Check bestimmt den Default nur bei
  Neuinstallationen; bei AC-Kopplung legen Kunden mit bestehender
  IES-Anlage jetzt einen HS50E-D-Speicher drauf. Der useEffect hat
  `isACCoupling` in der Dep-List, damit Mode-Switches den Default
  korrekt neu berechnen.

## [2.7.13] – 2026-04-24 – AC-Kopplung 1:1 nach GBC-Referenz (kein Inverter/Backup)

### Added
- **Dynamische Phasenkette je Installationsmodus** — Neuer Helper
  `getActivePhases(installationType)` in `navigation.ts`. Für
  `"ac-coupling"` liefert er `["battery","wallbox","accessory"]`, für
  `"new"` (bzw. `null`) die volle Kette
  `["inverter","backup","battery","wallbox","accessory"]`. Die AC-
  Kopplung-Reihenfolge orientiert sich exakt am GBC-Referenz-Flow:
  Nach dem Installationstyp-Picker springt das Original per
  `?configuratorNext=battery&installation_type=ac_coupling` direkt
  zur Batterie-Wahl; einen Backup-Schritt gibt es dort nicht.
- **`StepIndicator` respektiert `phases`-Prop** — Wenn AC-Kopplung
  aktiv ist, erscheinen im Fortschritts-Indikator nur 3 Kreise
  (Batterie → Wallbox → Zubehör) statt 5. Der Fortschrittsbalken
  teilt ebenfalls durch die passende Anzahl.

### Changed
- **`setInstallationType` resettet jetzt `selections` + `currentPhaseIndex`**.
  Vorher blieb das Selections-Array auf 5 Slots fixiert, auch nach
  einem Switch auf AC-Kopplung — der `currentPhaseIndex` wäre damit
  fehlerhaft ausgerichtet (Index 0 hätte "inverter" getroffen statt
  "battery"). Jetzt werden `selections` gemäß `getActivePhases()`
  neu aufgebaut.
- **`useConfigState` leitet `phase` aus `activePhases[currentPhaseIndex]`
  ab** und gibt `activePhases` mit in das Consumer-Objekt.
  `ConfiguratorShell` nutzt das für Progress-Berechnung und
  Step-Indicator-Prop.
- **`phase` darf jetzt `undefined` sein** (wenn `currentPhaseIndex`
  einmal außerhalb des Arrays liegt). `resolveStepLabels`-Aufruf,
  `currentNode`- und `phaseTree`-Ableitung sowie `phaseTitle` sind
  entsprechend guarded.
- **`ACTIVE_PHASES` ist jetzt ein Back-Compat-Alias** auf
  `DEFAULT_ACTIVE_PHASES`; Legacy-Importer brechen nicht, neue Aufrufer
  sollten `getActivePhases(installationType)` nutzen.

### Fixed
- **Back-Button aus dem ersten Batterie-Schritt** bei AC-Kopplung
  öffnet wieder den Installationstyp-Picker (unveränderter
  ConfiguratorShell-Code, profitiert jetzt aber von der korrekten
  Phasenkette — der Back-Handler hatte vorher keine saubere
  Rückkehr-Position).

## [2.7.12] – 2026-04-24 – Captcha-Challenge-Format zurück auf flaches v2

### Fixed
- **Captcha-Widget lief in den Fehler-Zustand** ("Captcha konnte nicht
  geladen werden — widget reported error state"). Root Cause (endlich
  wirklich gefunden): das PHP-Backend sendet die Challenge seit
  v2.6.2 (commit `ad97b57`) in einem nested Format:
  ```json
  { "_version": 1, "parameters": { "algorithm", "challenge", "salt", "maxNumber" }, "signature" }
  ```
  altcha@3.0.4 erkennt dieses Layout weder als v1 noch als v3:
  - `isChallengeV1()` prüft auf ein **Top-Level** `"challenge"`-Feld
    (`altcha/dist/main/altcha.js:6210`) — unser Payload hat nur
    `parameters.challenge`, also `false`.
  - `isChallengeValid()` prüft auf `parameters.nonce` **und**
    `parameters.keyPrefix` (die v3-Felder, `altcha.js:6213`) — beides
    nicht vorhanden, also ebenfalls `false`.
  - Ergebnis: `"Challenge validation failed."` Exception im Widget →
    `setState(State.ERROR)` → unser AltchaWidget-Wrapper fängt den
    Error-State und zeigt die rote "Captcha konnte nicht geladen
    werden"-Meldung.

  Lösung: Backend sendet jetzt wieder das **flache v2-Format** (wie
  vor v2.6.2):
  ```json
  { "algorithm", "challenge", "salt", "maxNumber", "signature" }
  ```
  altcha@3 detektiert das über `isChallengeV1` (Top-Level `challenge`
  vorhanden) und ruft intern `createChallengeFromV1()` auf, das es in
  die `{ parameters: { algorithm, nonce, keyPrefix, keyLength, cost,
  salt }, signature }`-Struktur übersetzt, die der PoW-Solver braucht.
  Der Kommentar-Block in `class-captcha.php` ist entsprechend
  korrigiert — ADR-015 war an der Stelle irreführend.

### Notes
- `verify_altcha()` ist von der Änderung nicht betroffen: die Funktion
  kann seit v2.6.2 sowohl das neue nested als auch das alte flache
  Submission-Payload-Format parsen. Das bleibt so.
- Im PHP-Backend-Test direkt geprüft:
  ```
  curl /wp-json/kw-pv-tools/v1/captcha/altcha/challenge
  → { "algorithm": "SHA-256", "challenge": "…", "maxNumber": 100000,
      "salt": "…", "signature": "…" }
  ```

## [2.7.11] – 2026-04-24 – IES ohne Triple-Power-Montage-Teile + DE-Sprach-Sweep

### Fixed
- **IES-Batterie zeigte fälschlich Holding Bracket + Base Plate**:
  Die Accessory-Phase zählte für jede Batterie-Serie automatisch
  "Solax Triple Power Holding Bracket" (1 pro 2 Module) und
  "Solax Triple Power Base Plate" (1 pro Modul). Diese Produktnamen
  sind eindeutig Triple-Power-spezifisch; die IES HS50E-D-Serie hat
  eine eigene Montagelösung. Neues Feld `usesMountingAccessories` auf
  `BatterySeries` (default `true` für Backward-Compat); bei
  `ies-hs50e` explizit auf `false` gesetzt. In der Accessory-UI wird
  der "Batterie-Zubehör (automatisch hergeleitet)"-Abschnitt dann
  komplett ausgeblendet und die Items landen auch nicht in der
  Submit-Mail / PDF. (`AccessoryConfigurator.tsx:114-124`)
- **Breadcrumb zeigte englische Step-Keys**: Die Konfigurator-
  Breadcrumb unter dem Phasen-Titel rendere die rohen `steps`-Keys
  (z.B. "Split System › Three-phase inverter X3 › 8.0 kW"). Jetzt
  löst die neue Helper-Funktion `resolveStepLabels` jeden Step auf
  sein lokalisiertes `label` auf. Der Breadcrumb liest in de/en/cs
  konsistent. (`navigation.ts`, `ConfiguratorShell.tsx`)
- **Submit-Zusammenfassung zeigte "Notstrom: No" / "Wallbox: No Charger"**:
  Opt-out-Leaves im Katalog haben `value: null`. Der
  `confirmProduct`-Fallback in `useConfigState` nahm dann den rohen
  englischen Key ("No", "No Charger") als Value. Fallback-Reihenfolge
  jetzt `node.value || node.label || key` — Opt-outs zeigen die
  lokalisierte Bezeichnung ("Nein", "Kein Ladegerät"). (`useConfigState.ts:29`)
- **Deutsche Umlaut-Fehler im Katalog und in `messages/de.json`**:
  `Ladegerat` → `Ladegerät`, `Wahlen` → `Wählen`, `wahlen` → `wählen`,
  `Gerat`/`gerat` → `Gerät`/`gerät`.

### Added
- **`BatterySeries.usesMountingAccessories?: boolean`** — Flag um
  Triple-Power-Montage-Teile pro Serie aus- und einzuschalten. Default
  `true`; nur für Serien, die NICHT zum Triple-Power-Sortiment gehören,
  auf `false` setzen. Aktuell betrifft das nur `ies-hs50e`.
- **`resolveStepLabels(phase, lang, steps, catalog)`** — walkt den
  Tree entlang der Step-Keys und liefert für jeden Step das
  lokalisierte Label (oder fallback auf value/key). Wiederverwendbar
  für jede Breadcrumb-Anzeige.

## [2.7.10] – 2026-04-24 – Wallbox: "Mehr als eine"-Option entfernt

### Removed
- Wallbox-Root-Option **"Für mehr als eine Wallbox kontaktieren Sie bitte
  unseren Vertrieb."** aus dem Katalog-Tree (de/en/cs). Verbleibend:
  `Eine` (mit Leistungsklassen + Varianten) und `Kein Ladegerät`.
  Die drei Kontakt-Labels wurden auch aus `app/src/messages/{de,en,cs}.json`
  entfernt — waren nur Übersetzungs-Artefakte vom Original-Katalog-Recon.

## [2.7.9] – 2026-04-24 – S 2.5 / S 3.6 getrennt, T-BAT H 5.8 V3 als Teaser

### Changed
- **Triple Power S 25/S 36 aufgeteilt** in zwei eigenständige Serien:
  - `"s25"` — *Triple Power S 2.5* — Modul 2,5 kWh, Stops
    7,5 / 10 / 12,5 / 15 / 17,5 / 20 / 22,5 / 25 / 27,5 / 30 / 32,5 kWh
  - `"s36"` — *Triple Power S 3.6* — Modul 3,6 kWh, Stops
    10,8 / 14,4 / 18 / 21,6 / 25,2 / 28,8 / 32,4 / 36 / 39,6 / 43,2 / 46,8 kWh

  Bisher landeten beide in einer gemeinsamen Slider-Stop-Liste (22 Stops,
  22 × gemischt HS25 / HS36) und der User musste über `findEntriesForKwh`
  erraten, welches Modul hinter dem aktuellen Stop steckt. Jetzt führen
  beide Serien eigenständig ihre Slider-Stops und Montage-Varianten.
  Übergangs-Key `"s25-s36"` wird nicht mehr verwendet — frisch gestartete
  Sessions sind nicht betroffen; eine persistierte Alt-Session läuft
  normal ins Zurücksetzen, sobald der User in die Batterie-Phase kommt.

### Added
- **Batterie-Teaser "Bald verfügbar"**: Neues Feld `comingSoon?: boolean`
  auf `BatterySeries`. Einträge mit `comingSoon: true` werden im
  Thumbnail-Footer des Battery-Menüs gegraut (Grayscale + 40 % Opacity)
  mit einer Amber-Badge "Bald verfügbar" angezeigt und sind nicht
  klickbar. Auto-Selection überspringt sie. Erster Teaser: **T-BAT H 5.8 V3**
  (`key: "t-bat-h58-v3"`, scope `split`). Sobald die Montage-Daten
  vom Hersteller final sind, müssen `entries` + `sliderStops` befüllt
  und `comingSoon` entfernt werden.
- **i18n für "Bald verfügbar"**: Neue UI-Strings in de/en/cs
  (`comingSoon: "Bald verfügbar" | "Coming soon" | "Již brzy"`).

## [2.7.8] – 2026-04-24 – Batteriemenü im GBC-Stil + Slider `−`/`+` Buttons

### Added
- **Serien-Thumbnail-Row am unteren Rand des Battery-Menüs**:
  Die verfügbaren Batterieserien (je nach Inverter: IES HS50E-D oder die
  drei Triple-Power-Serien) werden jetzt als kleine klickbare Produkt-
  bilder unter dem Detail-Bereich gezeigt. Aktiv-Serie hat primäre Border
  + Ring. Klick wechselt die Serie, Slider springt auf deren kleinsten Stop.
- **Auto-Selected erste Serie**: Statt einer vorgelagerten Serien-Grid-
  Seite landet der User direkt im Detail-View der ersten verfügbaren
  Serie und kann über die Thumbnail-Row wechseln. Weniger Klicks bis zur
  Kapazitätswahl, klarere visuelle Hierarchie.
- **Gelbe kWh-Pill** über dem Slider-Thumb (wie GBC) — die aktuelle
  Kapazität bewegt sich sichtbar mit dem Thumb mit.
- **`−` / `+` Buttons am Kapazitäts-Slider** (links rot / rechts grün).
  Springen jeweils zum vorigen/nächsten `sliderStop`. Fallback für Mobile-
  User, die die kleinen Tick-Dots schwer präzise treffen.
- **`−` / `+` Buttons am Power-Slider** (Inverter-Leistungsauswahl) mit
  identischer Optik. Konsistente Slider-UX über den ganzen Konfigurator.
- **Dynamische "X.XX kWh Batterie Montage"-Textzeile** unter dem Slider;
  zeigt die tatsächlich montierte Kapazität der aktuell gewählten Variante
  (nicht den Roh-Slider-Wert) und aktualisiert sich bei jeder Änderung.

### Changed
- `BatteryConfigurator` hat jetzt nur noch einen UI-Zustand (Detail-View
  mit Thumbnail-Row) statt zweier Screens (Grid → Detail). Die
  Rating-Bar-Kacheln aus dem alten Grid-View sind entfallen; die Info
  liegt jetzt kompakter im Produkt-Thumbnail-Tooltip.
- "Zurück"-Button im Battery-Menü ist jetzt ein dunkler Secondary-Button
  (statt ghost), passend zum GBC-Referenzbild.
- Numeric-Ruler unter dem Kapazitäts-Slider bekommt links/rechts horiz.
  Abstand in Spalten-Breite der `−`/`+` Buttons, damit die Skala bündig
  mit dem eigentlichen Track fluchtet.

## [2.7.7] – 2026-04-24 – Revert IES-Backup (Domänenfehler), Altcha-Fixes behalten

### Reverted
- **`X3 EPS PBOX 60 kW` aus dem Backup-Tree entfernt** (alle drei Locales).
  Die v2.7.6-Annahme "IES-Wechselrichter brauchen ein anderes Backup-
  Produkt" war falsch — der Stand aus v2.7.5 (Ja → X3 EPS Box + X3 Matebox
  Advanced, Nein) ist der korrekte.
- **`inverterLine`-Mechanik entfernt**: `InverterLine`-Type aus `types.ts`,
  Feld aus `ConfigNode` und `PhaseSelection.selectedProduct`, Propagation
  aus `useConfigState.ts`, Filter-Ast aus `solax/rules.ts`. Damit auch
  69 Inverter-Leaf-Tags aus dem Katalog (waren stumme Metadaten ohne
  aktive Wirkung nach dem Revert).

### Retained from 2.7.6
- **Altcha-Widget**: `language`-Attribut, dynamischer `altcha/i18n/<lang>`-
  Import, `expired`-Event-Handler mit Token-Reset + Hinweistext bleiben
  aktiv. Das sind reine UX-Verbesserungen auf der Captcha-Seite,
  unabhängig von der Backup-Katalogfrage.

## [2.7.6] – 2026-04-24 – IES-Backup-Box + Altcha nach Doku

### Added
- **IES-eigene Notstrom-Box**: SolaX X3-IES-Wechselrichter brauchen die
  `X3 EPS PBOX 60 kW` (product_code B-210-10081, Bild `EPS 60 kW.png`),
  nicht die für Split-System-Hybride vorgesehene X3 EPS Box oder
  X3 Matebox Advanced. Das Produkt war in `analysis/products.json` als
  "X3 IES / Ultra"-kompatibel dokumentiert, fehlte aber im aktiven
  Katalog. Jetzt unter `backup/<lang>/tree/Yes/children/X3 EPS PBOX 60 kW`
  eingetragen (3 Locales).
- **Katalog-Feld `inverterLine: "hybrid" | "ies"`**: Neuer Discriminator
  am `ConfigNode`, damit wir innerhalb der X3-Welt (`phaseType: "x3"`)
  zwischen der klassischen Hybrid-Serie und der IES-Serie unterscheiden
  können. 69 Inverter-Leaves getaggt (3 X1-Hybrid + 12 X3-Hybrid + 8 IES
  × 3 Locales). Ultra-Inverter bleiben bewusst untagged, bis die
  Domänen-Zuordnung geklärt ist — der Migrations-Fallback zeigt ihnen
  weiterhin alle Backup-Optionen.
- **`inverterLine` in `PhaseSelection.selectedProduct`**: Feld wird vom
  bestätigten Inverter-Leaf in den Store propagiert (`useConfigState.ts`).

### Changed
- **`solax/rules.ts` Backup-Filter**: Neben `phaseType` wird jetzt auch
  `inverterLine` gegengeprüft. Wenn der Inverter eine Linie hat und das
  Backup-Produkt eine abweichende, fliegt die Option raus. Untagged
  Backup-Produkte passen weiter durch, damit halb-annotierte Kataloge
  nicht User blocken.
- **Altcha-Widget laut offizieller Doku überarbeitet**:
  - `language={lang}`-Attribut setzt die Widget-Texte auf de/en/cs.
  - Vor `import("altcha")` wird jetzt die passende i18n-Datei
    (`altcha/i18n/de` / `en` / `cs`) dazugeimportiert, damit der
    `language`-Prop überhaupt eine Wirkung hat (sonst bleibt die
    Fallback-Sprache).
  - Neuer `expired`-Event-Listener: wenn die Challenge abläuft, wird
    `onVerify("")` ausgelöst → Submit-Button sperrt sich wieder,
    Hinweistext "Captcha abgelaufen — bitte erneut bestätigen" erscheint.

### Notes
- Die README von altcha@3.0.4 (`node_modules/altcha/README.md`) war die
  Referenz für den Abgleich. Alle offiziell dokumentierten Attribute
  (`challenge`, `language`, `name`, `type`, `auto`, `workers`, `display`)
  wurden geprüft; unsere Integration nutzt jetzt die idiomatische
  `challenge`-URL plus `language` und setzt den Rest auf die Defaults
  (`type="checkbox"`, `auto="off"`).

## [2.7.5] – 2026-04-24 – Captcha-Fix: altcha v3 erwartet `challenge` statt `challengeurl`

### Fixed
- **Captcha blieb stumm**: Der Submit-Button im Konfigurator blieb dauerhaft
  disabled, weil das Altcha-Widget nie eine Challenge gefetcht und nie
  verifiziert hat. Ursache: **altcha v3.x hat das Attribut umbenannt**.
  In v2.x hieß es `challengeurl`, in v3.x ist es `challenge` (die
  Property akzeptiert sowohl ein vorberechnetes Challenge-Objekt als auch
  einen URL-String). Das hat wir v2.0+ nie gefixt, weil beim Upgrade
  `altcha@^3.0.4` das Widget-API still geändert wurde und die
  `props_definition` in `dist/main/altcha.js` (Zeile 7036ff.) kein
  `challengeurl` mehr observed. Ergebnis: das Attribut wurde beim Render
  zwar auf dem DOM-Element gesetzt, aber vom Custom-Element komplett
  ignoriert → kein Fetch zur Challenge-URL → kein PoW → kein payload →
  Submit-Button ewig disabled.
  Jetzt setzt `AltchaWidget` das Attribut `challenge={challengeUrl}`.
  (`AltchaWidget.tsx:112`)

### Added
- **Sichtbare Captcha-Fehler-UI**: Wenn der altcha-Modul-Import fehlschlägt,
  der `/wp-json/.../captcha/config`-Endpoint einen HTTP-Fehler zurückgibt,
  oder das Widget nach 10 Sekunden nicht anspringt, zeigt der Konfigurator
  jetzt eine sichtbare Fehlermeldung mit Reload-Button und dem
  Fehler-Detail. Vorher sah der User nur ein leeres Feld ohne zu wissen,
  warum der Submit-Button disabled blieb. (`AltchaWidget.tsx`,
  `captcha/client/index.tsx`)
- **Dev-Logs**: `console.log("[captcha] statechange", detail)` bei
  `NODE_ENV !== "production"` erleichtert künftige Diagnosen ohne zweites
  Build. Errors im Config-Fetch und Modul-Import gehen immer ins
  `console.error`.

### Notes
- Der Backend-Teil (`class-captcha.php`) war schon korrekt — das
  v1-Envelope-Format `{ _version, parameters, signature }` wurde bereits
  in `ad97b57` für v2.6.2 geliefert. Der v3-Migrationsschritt für den
  Backend-Payload war damals vollständig, aber die Widget-Attribut-
  Umbenennung ist erst jetzt aufgefallen.

## [2.7.4] – 2026-04-24 – CSP minimal gehalten (Theme-CSS nicht mehr kaputt)

### Fixed
- **"CSS gesprengt" auf Konfigurator-Seiten**: Bereits in v2.7.2 wurde die
  CSP auf Nicht-Konfigurator-Seiten komplett entfernt (Menu-Toggle-Fix).
  Auf der Konfigurator-Seite selbst greift sie aber weiterhin — und dort
  zerstörte sie reihum Elemente des umgebenden WP-Themes:
  - `font-src 'self' data:` → **Google Fonts geblockt** → Theme-Typografie
    fällt auf System-Fonts zurück (wirkt wie "Layout kaputt", Buchstaben-
    abstände stimmen nicht, Headlines sehen falsch aus)
  - `script-src 'self' 'unsafe-inline'` → Tag-Manager, Analytics, CDN-JS
    geblockt
  - `frame-src 'self'` → YouTube/Vimeo im Theme-Content nicht mehr
    einbettbar
  - `connect-src 'self'` → externe API-Calls (Cookie-Banner, Analytics)
    geblockt
  Ab v2.7.4 sendet das Plugin auf Konfigurator-Seiten nur noch
  `frame-ancestors 'self' https://www.kw-baustoffe.de https://kw-baustoffe.de`
  (Clickjacking-Schutz) plus die generischen Security-Header
  (`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`).
  Das Theme läuft unverändert; der Konfigurator (im iframe) ist davon
  nicht betroffen, weil er als statische HTML-Datei aus
  `/wp-content/plugins/.../embed/` ausgeliefert wird und ohnehin keinen
  PHP-generierten CSP-Header bekommt. (`class-csp.php:53-83`)

### Removed
- Die alten CSP-Direktiven `default-src`, `script-src`, `style-src`,
  `img-src`, `font-src`, `connect-src`, `worker-src`, `frame-src`,
  `object-src`, `base-uri`, `form-action` auf der Parent-Seite.
  Der Kommentar-Block zu `SCRIPT_HASHES` (Batch F geplant) bleibt als
  Platzhalter erhalten, falls wir später doch eine hash-basierte
  `script-src`-Allowlist für den _iframe_ ausrollen.

## [2.7.3] – 2026-04-24 – Batterie-Minimalkonfig + Inverter-Layout + X3-Hybrid-Foto

### Added
- **Triple-Power-S-Batterie**: Zwei neue Slider-Stops `7,5 kWh` (HS25,
  1× BMS + 3× S 2.5) und `10,8 kWh` (HS36, 1× BMS + 3× S 36). Der Typ
  erlaubt laut `minModules: 3` diese Drei-Modul-Ausbauten bereits, die
  Stops fehlten aber in `S_ENTRIES`, weswegen der Slider erst bei
  10 kWh / 14,4 kWh einstieg.
- **Neues Produktfoto `X3 Hybrid Serie.png`** für alle X3-Hybrid-G4 (Non-
  PRO) Wechselrichter. Quelle: at.solaxpower.com Mai 2025.

### Changed
- **X3-Inverter-Reihenfolge**: X3-Hybrid-G4 (Non-PRO) steht in jeder
  Leistungsklasse links, X3-HYB-G4 PRO rechts. Die 12.0 kW-Karte hatte
  PRO auf `priority: 2` und Hybrid auf `priority: 3` — das ist die einzige
  Power-Stufe, die invertiert war. Alle Hybrid/PRO-Paare laufen jetzt mit
  Hybrid < PRO im Sort-Order.

## [2.7.2] – 2026-04-24 – Plugin-Integration: CSP-Header scope-gated

### Fixed
- **Menu-Toggle des Themes bricht, sobald das Plugin aktiv ist**: Der
  `Content-Security-Policy`-Header wurde auf ALLEN Frontend-Seiten der Site
  gesetzt (via `add_action('wp', 'send_csp')`), auch wenn die Seite den
  Konfigurator gar nicht einbettet. `script-src 'self'` (ohne
  `'unsafe-inline'`, weil die Seite kein Konfigurator ist) blockiert jedes
  inline-JS, das Themes typischerweise für Mobile-Menu-Toggles, hamburger-
  buttons, Tag-Manager, Analytics-Pixel oder Cookie-Banner nutzen. Nutzer
  sahen nur, dass das Hamburger-Menü auf einmal nichts mehr tut — die
  Browser-Konsole zeigte zwar `Refused to execute inline script ...`, aber
  Site-Besitzer ohne DevTools-Skills finden das nicht. Jetzt früh-return
  aus `CSP::send_csp()`, wenn die Seite keinen Konfigurator hat; das Theme
  bleibt unberührt. (`class-csp.php:53-64`)

### Notes
- **MPPT-Labels bei der WR-Auswahl**: Der Render-Pfad ist korrekt — die
  Karten zeigen an jedem Power-Level die MPPT-Notation (`MPPT (Strings):
  2 (2/1)` vs `MPPT (Strings): 3 (1/1/1)`) via `renderFormattedLabel` über
  die `<small>`-Tag-Unterstützung. Der Katalog ist gegenüber der GBC-
  Referenz 1:1 identisch. Wer das Label "nicht mehr" sieht, hat
  vermutlich noch eine ältere Plugin-Version aus der Zeit vor Commit
  `7486e14` (fix: render <small> labels) im Browser-Cache. v2.7.2 bringt
  durch das erneute Asset-Hashing ohnehin einen Cache-Bust.

## [2.7.1] – 2026-04-24 – Code-Review-Fixes auf v2.7.0

### Fixed
- **AC-Coupling-Banner-Text**: Vorher versprach der gelbe Hinweis "Produktauswahl
  ist auf Retrofit-kompatible Komponenten eingeschränkt", tatsächlich wirkt der
  Filter aber nur in der Backup-Phase (Inverter/Battery/Wallbox/Accessory haben
  noch keine `compatibility`-Tags, der Migrations-Fallback lässt alles durch).
  Text jetzt präzise: "In der Backup-Phase werden nur retrofit-taugliche
  Optionen angezeigt; die übrigen Phasen zeigen das volle Sortiment."
- **IES-Inverter-Branch unerkannt**: `isX3Selected` prüfte nur `steps.includes("Split System")`
  und übersah damit den gesamten IES-Zweig (8 X3-Inverter-Produkte von
  `Solax X3-IES-4.0K` bis `15.0K`). Nutzer, die einen IES-Inverter wählten,
  bekamen die Backup-Filterung nicht zu sehen. Detection läuft jetzt primär
  über `selectedProduct.phaseType`-Tag am Katalogknoten; der Step-String-Pfad
  bleibt als Fallback für den Split-System-Zweig erhalten.
- **Dev-Warning-Spam**: `warnMissingPhaseTag` feuerte bei jedem Rendern der
  Backup-Phase für die Strukturknoten "Yes" und "No" — beide sind gewollt
  untagged (keine Produkte). Gate jetzt auf `product_name && !children`
  verschärft, sodass Warnungen nur noch echte Katalog-Lücken an Produkt-Leaves
  anzeigen.
- **Tschechische Plural-Grammatik**: Zubehör-Summary zeigte "2 položek"
  (Genitiv-Plural, korrekt für 5+) auch für 2–4. `pluralize()` nutzt jetzt
  `Intl.PluralRules` und unterscheidet one/few/other korrekt: 1 položka,
  2–4 položky, 5+ položek.
- **AC-Coupling-Banner i18n inline**: Vorher verschachtelte
  `lang === "de" ? ... : lang === "en" ? ... : ...` Ternaries, jetzt saubere
  `AC_COUPLING_NOTICE: Record<Lang, {title, body}>`-Map wie die anderen
  i18n-Konstanten.
- **Latente Detection-Regression**: Als Folge von B3 wurde sichergestellt,
  dass `getInverterPhaseType` vor einer unvollständigen Selektion null
  zurückgibt (statt falsch "x1" oder "x3"), sodass der Backup-Filter
  konservativ alle Optionen passieren lässt.

### Added
- **`PHASE_TITLES.finish`** für de/en/cs (vorher nur Fallback auf "finish").
- **`installationType`-Parameter in `validateCombination`**: Safety-Net gegen
  inkonsistente persistierte States (AC-Coupling-Modus + echtes Backup-Produkt
  im `selectedProduct`). "Kein Backup"-Opt-out ("No", kein phaseType) bleibt
  explizit valide.
- **93 `phaseType`-Tags an Inverter-Leaves** in de/en/cs (x1: 3 Produkte ×
  3 Locales; x3: 28 Produkte × 3 Locales inkl. IES).

### Changed
- **`next.config.ts` — `experimental.cpus` env-gated**: Nur noch gesetzt,
  wenn `NEXT_BUILD_CPUS` als env-Var vorliegt. Auf normalen Dev-Maschinen
  parallelisiert der Build wieder mit 4+ Workern. `sync-konfigurator.sh`
  setzt Default=1 für den CI-Container (OpenVZ, numproc=1100).
- **`clearInstallationType` dokumentiert**: Zurücksetzen bewahrt die
  aktuelle Sprache (`lang`), damit ein Sprachwechsel beim Mode-Umschalten
  nicht verlorengeht.

### Removed
- **`FlatProduct.phaseType`** war totes Feld (in keinem Code gesetzt oder
  gelesen). Entfernt.

## [2.7.0] – 2026-04-23 – Installations-Modus, i18n-Vervollständigung, phaseType-Refactor

### Added
- **Installations-Modus**: Konfigurator unterscheidet jetzt zwischen Neuanlage
  und AC-Kopplung/Retrofit. SolaX-Regel (`filterOptions`) erhält den neuen
  fünften Parameter `installationType` und filtert bei AC-Kopplung die
  Backup-Optionen auf die explizit kompatiblen Pfade (`compatibility: ["new"]`
  vs. `["new", "ac-coupling"]` am Katalogknoten). Ein Migrations-Fallback
  behält nicht-annotierte Pfade sichtbar, solange noch keine `compatibility`-
  Markierung vorliegt. Heuristik erkennt Legacy-Einträge mit "hac"/"retrofit"
  im Namen. (PR #1)
- **Strukturierte phaseType-Tags** (`"x1"` / `"x3"`) am `ConfigNode` ersetzen
  das bisherige Substring-Matching auf `product_name` für die X1/X3-Backup-
  Kompatibilität. Robuster gegen Produktumbenennungen. Fehlende Tags an
  Leaf-Produkten lösen eine dev-only `console.warn`-Meldung aus, statt still
  zu versagen. SolaX-Backup-Katalog ist in de/en/cs mit `phaseType: "x3"`
  annotiert. (PR #3)

### Changed
- **Vollständige i18n** für Konfigurator-UI in de/en/cs: `OptionGrid`-Leer-
  zustand, Zubehör-Summary (Singular/Plural), PowerSlider (Titel, Kontakt-CTA,
  ARIA-Label, "keine Produkte"-Fallback), `ConfiguratorShell` Accessory-
  Fallback. Keine deutschen Festtexte mehr im englischen oder tschechischen
  Locale. (PR #2)

### Fixed
- Mobile-Layout: Batterie-Slider-Labels und die stacked Part-Images
  überlappten sich auf schmalen Viewports. Slider-Labels wurden neu
  positioniert; Stacks bekommen adäquaten Abstand.

### Infrastructure
- `next.config.ts` setzt `experimental.cpus = 1`, damit der Static-Export-
  Build auf Umgebungen mit harter `numproc`-Begrenzung (OpenVZ-Container)
  nicht an EAGAIN bei `spawn` scheitert. Auf Hosts ohne Limit nur marginal
  langsamer.

## [2.6.2] – Hotfix: composer.lock, UpgradeCleaner, Preview-Ticket-ID

### Fixed
- `composer.lock` war nicht synchron mit `composer.json`: der mpdf-Eintrag
  fehlte vollständig, `composer install --no-dev` verweigerte deshalb die
  Auflösung und das CI-Build-ZIP von v2.6.0 wurde ohne mpdf ausgeliefert —
  das PDF-Feature (Headline von v2.6.0) warf zur Laufzeit
  `RuntimeException('mpdf nicht verfügbar')`. Lockfile jetzt regeneriert;
  `mpdf/mpdf`-Constraint gleichzeitig von `^8.1` auf `~8.1.0` verschärft,
  damit `composer update` in Zukunft nur Patch-Releases innerhalb der
  8.1.x-Serie zieht und nicht versehentlich auf 8.2+ springt (was PHP-
  7.4-Hosts brechen würde).
- `UpgradeCleaner` (eingeführt in v2.5.5 gegen das "files could not be
  copied"-Problem auf Shared Hosts mit gemischten Linux-User-Ownern) war
  seit Commit `a769b91` (v2.5.8) versehentlich nicht mehr registriert —
  die Klassendatei blieb im Tree, aber weder `require_once` noch
  `UpgradeCleaner::register()` wurden ausgeführt. Auto-Update auf v2.6.0
  schlug auf betroffenen Hosts identisch fehl wie vor v2.5.5. Registrierung
  wiederhergestellt.
- PDF-Endpoint (`class-pdf-endpoint.php`) rief bei jedem "Konfiguration als
  PDF"-Klick `TicketId::generate()` auf und inkrementierte damit den
  persistenten Zähler in `wp_options`. Ein User, der 10× das PDF öffnete
  und anschließend submittete, bekam Ticket #11 statt #1 — jede Annahme
  "Ticket N = N-te Submission" driftete stumm. Preview-PDFs tragen jetzt
  eine ephemere `PV-PREVIEW-YYYYMMDD-<hex>`-ID aus `random_bytes(3)`, die
  nie persistiert oder wiederverwendet wird. Echte Submissions nutzen
  weiterhin unverändert `TicketId::generate()` via `SubmitHandler`.

## [2.5.5] – Hotfix: Auto-Update-Install scheiterte mit "files could not be copied"

### Fixed
- WordPress's `copy_dir()` in `Plugin_Upgrader::install_package()` scheiterte
  auf Shared Hosts, wenn bestehende Plugin-Dateien von einem anderen Linux-User
  angelegt wurden als dem Webserver-User (klassisch: Plugin via FTP als
  `ftpuser` hochgeladen, PHP-FPM läuft als `www-data`). Die Meldung "The update
  cannot be installed because some files could not be copied" erschien, Update
  brach ab.
  Neue `UpgradeCleaner`-Klasse hooked sich in `upgrader_pre_install` ein und
  löscht das `kw-pv-tools/`-Verzeichnis proaktiv — der Directory-Owner darf
  auch fremdeigene Dateien darin löschen (Linux-Directory-Semantik), während
  das Überschreiben scheiterte. WP's Install startet danach auf leerem
  Verzeichnis und klappt.
- **Wichtig:** Der Fix ist selbst Teil von v2.5.5 — das **erste** Update
  auf v2.5.5 muss manuell via FTP oder WP-Admin "Plugin hochladen" passieren,
  alle folgenden Updates funktionieren dann automatisch.

## [2.5.4] – Hotfix: konfigurator-Seiten Hydration

### Fixed
- CSP-Header wurde bei `send_headers` mit `script-src 'self'` ausgeliefert,
  bevor der Shortcode-Render `CSP::allow_inline()` aufrufen konnte. Browser
  blockierte alle `self.__next_f.push(…)` Next.js-RSC-Inline-Scripts, React
  hydrierte nie → Buttons wie „Klassisches System" / „Alles in Einem IES"
  waren nicht klickbar. `CSP::send_csp()` erkennt die Konfigurator-Seite
  jetzt autark via `has_shortcode()` / `has_block()` auf dem Main-Post zum
  richtigen Hook-Zeitpunkt.

### Changed (Batch A — review fix-up)
- Provider-System für Captcha auf Altcha-only reduziert. hCaptcha und reCAPTCHA v3 entfernt inkl. PHP-Backend, Frontend-Widgets und NPM-Dependencies. Siehe `docs/DECISIONS.md` ADR-013.
- Shortcode-Asset-Rewriting umfasst jetzt auch `<img>`/`<link>` im Body-Markup — Produktbilder laden endlich aus dem Plugin-URL (vorher 404).
- PDF-Generation vollständig entfernt: `app/src/lib/pdf.tsx`, `@react-pdf/renderer` aus `package.json`. Der PDF-Versand war seit der Phase-10-Migration (Static Export + WP-Plugin) funktional tot, wurde aber weiterhin in Docs und README versprochen. Die Benachrichtigungs- und Bestätigungs-Mails sind reine HTML-Mails via `wp_mail()`.
- `post-export.mjs` scannt Manufacturer-Verzeichnisse dynamisch statt SolaX hardcoded.

### Fixed (previous)
- CSP: `strict-dynamic` entfernt (blockierte ohne Hashes alle Scripts).
- CSRF-Schutz via Origin-Check auf `/submit`.
- Altcha-Replay-Schutz via Transient-Fingerprint.
- Rate-Limiter atomisiert (`START TRANSACTION` + `SELECT … FOR UPDATE`).
- Honeypot-Check vor Rate-Limit und Validation.
- Path-Traversal-Guard in `Assets::extract_asset_tags()`.

## [2.1.0] – 2026-04-20 (vormals getaggt v2.1.0)
- Phase-11-Meilenstein: UX & Ops (siehe `PHASE_10_DONE.md`, `readme.txt`).

## [1.0.0] – 2026-04-20

### Added
- Initial Release: SolaX-Konfigurator (Wechselrichter, Backup, Batterie, Wallbox)
- Multi-Hersteller-Architektur (SolaX als erster Hersteller, Registry für weitere)
- Security-Hardening (CSP, Rate-Limit, hCaptcha, Honeypot, Input-Sanitization)
- CI-Pipeline (GitHub Actions: validate + vitest + data-tests + build)
- Vollständige Dokumentation (ONBOARDING, ARCHITECTURE, DECISIONS, ADD_MANUFACTURER, SECURITY, FAQ, USER_MANUAL, DEPLOY)
- PDF-Export mit KW-Branding (@react-pdf/renderer)
- E-Mail-Integration (Resend, Vertrieb + Kunden-Bestätigung)
- iFrame-Embedding mit postMessage-Resize
- 3-sprachig (DE/EN/CS)
- 68 Daten-Tests (Node.js, datenbasiert)
- Passwort-Schutz (Staging-Phase)

## [0.x.x] – Prä-1.0.0
Iterative Entwicklung (Phasen 0–6), siehe Git-History.

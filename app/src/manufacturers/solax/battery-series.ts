/**
 * Battery montage table — mirror of GBC Solino's server-side data.
 *
 * Extracted from inc/battery_slider.php:
 *   POST body `battery=<series>` → JSON `batteryData` object keyed by model.
 *
 * Each entry is one buildable configuration (one capacity + one variant).
 * Some capacities have two variants (Master+BMS_G2 vs all-Slave+BMS_G1 on
 * T58 and T30) — the UI must show them as "Montage 1 / Montage 2" cards.
 *
 * The sliderStops field is the deduplicated list of kWh values the user
 * can pick; identical stops with multiple variants collapse to one stop
 * and the UI then renders N variants at that position.
 */

export interface MontageParts {
  master?: number;
  slave?: number;
  BMS?: number;
  BAT_BOX?: number;
  Series_BOX?: number;
  BMS_Paralell_Box_G1?: number;
  BMS_Paralell_Box_G2?: number;
}

export interface MontageEntry {
  kwh: number;
  model: string;
  moduleKwh: number;
  minModules: number;
  parts: MontageParts;
}

export interface SeriesRatings {
  maxPower: number;
  startingCapacity: number;
  installationFriendly: number;
  compactDesign: number;
  temperatureRange: number;
}

export interface BatterySeries {
  key: string;
  label: string;
  moduleLabel: string;
  hint?: string;
  image: string;
  ratings: SeriesRatings;
  entries: MontageEntry[];
  sliderStops: number[];
}

const T58_ENTRIES: MontageEntry[] = [
  { kwh: 11.5, model: "T58", moduleKwh: 5.8, minModules: 2, parts: { master: 1, slave: 1 } },
  { kwh: 17.3, model: "T58", moduleKwh: 5.8, minModules: 2, parts: { master: 1, slave: 2 } },
  { kwh: 23,   model: "T58", moduleKwh: 5.8, minModules: 2, parts: { master: 1, slave: 3 } },
  { kwh: 34.6, model: "T58", moduleKwh: 5.8, minModules: 2, parts: { slave: 6, BMS_Paralell_Box_G1: 1 } },
  { kwh: 34.6, model: "T58", moduleKwh: 5.8, minModules: 2, parts: { master: 1, slave: 5, BMS_Paralell_Box_G2: 1 } },
  { kwh: 46,   model: "T58", moduleKwh: 5.8, minModules: 2, parts: { slave: 8, BMS_Paralell_Box_G1: 1 } },
  { kwh: 46,   model: "T58", moduleKwh: 5.8, minModules: 2, parts: { master: 1, slave: 7, BMS_Paralell_Box_G2: 1 } },
];

const S_ENTRIES: MontageEntry[] = [
  // HS25 — 2.5 kWh/Modul
  { kwh: 10,   model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 4 } },
  { kwh: 12.5, model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 5 } },
  { kwh: 15,   model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 6 } },
  { kwh: 17.5, model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 7 } },
  { kwh: 20,   model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 8 } },
  { kwh: 22.5, model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 9 } },
  { kwh: 25,   model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 10, Series_BOX: 1 } },
  { kwh: 27.5, model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 11, Series_BOX: 1 } },
  { kwh: 30,   model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 12, Series_BOX: 1 } },
  { kwh: 32.5, model: "HS25", moduleKwh: 2.5, minModules: 3, parts: { BMS: 1, BAT_BOX: 13, Series_BOX: 1 } },
  // HS36 — 3.6 kWh/Modul
  { kwh: 14.4, model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 4 } },
  { kwh: 18,   model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 5 } },
  { kwh: 21.6, model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 6 } },
  { kwh: 25.2, model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 7 } },
  { kwh: 28.8, model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 8 } },
  { kwh: 32.4, model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 9 } },
  { kwh: 36,   model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 10, Series_BOX: 1 } },
  { kwh: 39.6, model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 11, Series_BOX: 1 } },
  { kwh: 43.2, model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 12, Series_BOX: 1 } },
  { kwh: 46.8, model: "HS36", moduleKwh: 3.6, minModules: 3, parts: { BMS: 1, BAT_BOX: 13, Series_BOX: 1 } },
];

const T30_ENTRIES: MontageEntry[] = [
  { kwh: 6,  model: "T30", moduleKwh: 3.1, minModules: 2, parts: { BMS: 1, BAT_BOX: 2 } },
  { kwh: 9,  model: "T30", moduleKwh: 3.1, minModules: 2, parts: { BMS: 1, BAT_BOX: 3 } },
  { kwh: 12, model: "T30", moduleKwh: 3.1, minModules: 2, parts: { BMS: 1, BAT_BOX: 4 } },
  { kwh: 12, model: "T30", moduleKwh: 3.1, minModules: 2, parts: { BMS: 1, BAT_BOX: 4, BMS_Paralell_Box_G2: 1 } },
  { kwh: 18, model: "T30", moduleKwh: 3.1, minModules: 2, parts: { BMS: 1, BAT_BOX: 6, BMS_Paralell_Box_G2: 1 } },
  { kwh: 24, model: "T30", moduleKwh: 3.1, minModules: 2, parts: { BMS: 1, BAT_BOX: 8, BMS_Paralell_Box_G2: 1 } },
];

function stops(entries: MontageEntry[]): number[] {
  return [...new Set(entries.map((e) => e.kwh))].sort((a, b) => a - b);
}

// Ratings are on a 0..10 scale (exactly as counted from GBC's animated-square
// divs: the DOM renders one <div class="animated-square"> per point).
export const SOLAX_BATTERY_SERIES: BatterySeries[] = [
  {
    key: "s25-s36",
    label: "Triple Power S 25/S 36",
    moduleLabel: "2,5 / 3,6 kWh je Modul",
    image: "/products/batteries/s25-s36.png",
    ratings: { maxPower: 9, startingCapacity: 7, installationFriendly: 9, compactDesign: 9, temperatureRange: 9 },
    entries: S_ENTRIES,
    sliderStops: stops(S_ENTRIES),
  },
  {
    key: "t58",
    label: "Triple Power T58",
    moduleLabel: "5,8 kWh je Modul",
    hint: "TIPP: Bestes Preis/kWh Verhältnis",
    image: "/products/batteries/t58.png",
    ratings: { maxPower: 6, startingCapacity: 5, installationFriendly: 5, compactDesign: 7, temperatureRange: 6 },
    entries: T58_ENTRIES,
    sliderStops: stops(T58_ENTRIES),
  },
  {
    key: "t30",
    label: "Triple Power T30",
    moduleLabel: "3,1 kWh je Modul",
    image: "/products/batteries/t30.png",
    ratings: { maxPower: 8, startingCapacity: 9, installationFriendly: 7, compactDesign: 8, temperatureRange: 9 },
    entries: T30_ENTRIES,
    sliderStops: stops(T30_ENTRIES),
  },
];

export function findEntriesForKwh(series: BatterySeries, kwh: number): MontageEntry[] {
  return series.entries.filter((e) => Math.abs(e.kwh - kwh) < 0.01);
}

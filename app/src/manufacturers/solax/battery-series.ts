/**
 * Battery series metadata for the SolaX configurator.
 *
 * Derived from the reference GBC Solino configurator. Each series has a
 * capacity slider whose stops and step size reflect the actual product
 * range. `montage.moduleKwh` is the usable capacity per module / slave —
 * computeMontage() uses it to derive the part list at any chosen kWh.
 *
 * Keys are stable identifiers for URLs and the event bus; labels are the
 * display strings used on the option cards and the slider header.
 */

export type MontageVariant = "bms-batbox" | "master-slave";

export interface BatterySeries {
  key: string;
  label: string;
  moduleLabel: string;
  hint?: string;
  model: string;
  minKwh: number;
  maxKwh: number;
  defaultKwh: number;
  sliderStops: number[];
  moduleKwh: number;
  montageVariant: MontageVariant;
  coverImage?: string;
}

export const SOLAX_BATTERY_SERIES: BatterySeries[] = [
  {
    key: "s25-s36",
    label: "Triple Power S 25/S 36",
    moduleLabel: "2,5 / 3,6 kWh je Modul",
    model: "HS25",
    minKwh: 0,
    maxKwh: 50,
    defaultKwh: 10,
    sliderStops: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
    moduleKwh: 2.5,
    montageVariant: "bms-batbox",
  },
  {
    key: "t58",
    label: "Triple Power T58",
    moduleLabel: "5,8 kWh je Modul",
    hint: "TIPP: Bestes Preis/kWh Verhältnis",
    model: "T58",
    minKwh: 0,
    maxKwh: 50,
    defaultKwh: 11.5,
    sliderStops: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50],
    moduleKwh: 5.75,
    montageVariant: "master-slave",
  },
  {
    key: "t30",
    label: "Triple Power T30",
    moduleLabel: "3,1 kWh je Modul",
    model: "T30",
    minKwh: 0,
    maxKwh: 25,
    defaultKwh: 6,
    sliderStops: [0, 5, 10, 15, 20, 25],
    moduleKwh: 3,
    montageVariant: "bms-batbox",
  },
];

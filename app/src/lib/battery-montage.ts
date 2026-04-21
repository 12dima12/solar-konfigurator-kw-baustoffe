import type { BatterySeries, MontageEntry } from "@/manufacturers/solax/battery-series";
import { findEntriesForKwh } from "@/manufacturers/solax/battery-series";

export interface MontagePart {
  count: number;
  label: string;
}

export interface BatteryMontage {
  model: string;
  kwh: number;
  parts: MontagePart[];
}

const LABEL_MAP: Record<string, string> = {
  master: "Master",
  slave: "Slave",
  BMS: "BMS",
  BAT_BOX: "BAT BOX",
  Series_BOX: "Series BOX",
  BMS_Paralell_Box_G1: "BMS Parallel Box G1",
  BMS_Paralell_Box_G2: "BMS Parallel Box G2",
};

export function entryToMontage(entry: MontageEntry): BatteryMontage {
  const parts: MontagePart[] = [];
  const order: Array<keyof MontageEntry["parts"]> = [
    "master",
    "slave",
    "BMS",
    "BAT_BOX",
    "Series_BOX",
    "BMS_Paralell_Box_G1",
    "BMS_Paralell_Box_G2",
  ];
  for (const k of order) {
    const v = entry.parts[k];
    if (typeof v === "number" && v > 0) {
      parts.push({ count: v, label: LABEL_MAP[k as string] ?? (k as string) });
    }
  }
  return { model: entry.model, kwh: entry.kwh, parts };
}

/**
 * Returns every buildable montage variant for the requested capacity.
 * If the capacity has no exact match, returns the closest stop — callers
 * should snap the slider to an available stop before asking.
 */
export function montagesForKwh(series: BatterySeries, kwh: number): BatteryMontage[] {
  const entries = findEntriesForKwh(series, kwh);
  if (entries.length > 0) return entries.map(entryToMontage);
  // No exact match — pick the lowest stop ≥ requested.
  const stop = series.sliderStops.find((s) => s >= kwh) ?? series.sliderStops[series.sliderStops.length - 1];
  return findEntriesForKwh(series, stop).map(entryToMontage);
}

export function snapKwh(series: BatterySeries, kwh: number): number {
  if (series.sliderStops.length === 0) return 0;
  return series.sliderStops.reduce((prev, curr) =>
    Math.abs(curr - kwh) < Math.abs(prev - kwh) ? curr : prev,
  );
}

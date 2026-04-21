import type { BatterySeries } from "@/manufacturers/solax/battery-series";

export interface MontagePart {
  count: number;
  label: string;
}

export interface BatteryMontage {
  model: string;
  kwh: number;
  parts: MontagePart[];
}

/**
 * Snap a free-form kWh value to the nearest integer module count for this
 * series, bounded by min/max. Returns the resulting capacity plus the part
 * list the reference configurator would display as the single "Montage 1"
 * option.
 *
 * For master/slave series the first module is always the Master and every
 * additional module is a Slave. For BMS/BAT-BOX series the BMS count is
 * fixed at 1 and the BAT-BOX count scales with capacity.
 */
export function computeMontage(series: BatterySeries, requestedKwh: number): BatteryMontage {
  const clamped = Math.min(series.maxKwh, Math.max(series.minKwh, requestedKwh));
  const moduleCount = Math.max(0, Math.round(clamped / series.moduleKwh));
  const kwh = +(moduleCount * series.moduleKwh).toFixed(2);

  const parts: MontagePart[] =
    series.montageVariant === "master-slave"
      ? moduleCount === 0
        ? []
        : [
            { count: 1, label: "Master" },
            ...(moduleCount > 1 ? [{ count: moduleCount - 1, label: "Slave" }] : []),
          ]
      : moduleCount === 0
        ? []
        : [
            { count: 1, label: "BMS" },
            { count: moduleCount, label: "BAT BOX" },
          ];

  return { model: series.model, kwh, parts };
}

/**
 * Snap an arbitrary kWh value on the slider to the closest achievable
 * capacity for this series (integer module count). Useful as onChange
 * handler that ensures the thumb lands on a real capacity.
 */
export function snapKwh(series: BatterySeries, kwh: number): number {
  const { moduleKwh, minKwh, maxKwh } = series;
  const clamped = Math.min(maxKwh, Math.max(minKwh, kwh));
  const moduleCount = Math.round(clamped / moduleKwh);
  return +(moduleCount * moduleKwh).toFixed(2);
}

import { BATTERY_HOLDING_BRACKET, BATTERY_BASE_PLATE } from "@/manufacturers/solax/accessory-catalog";
import type { MontagePart } from "./battery-montage";

/**
 * Counts the actual storage modules in a battery montage. BMS and controller
 * parts don't count; only BAT BOX / Master / Slave add to the storage stack.
 */
export function countBatteryModules(parts: MontagePart[]): number {
  return parts
    .filter((p) => /^(BAT BOX|Master|Slave)$/i.test(p.label))
    .reduce((sum, p) => sum + p.count, 0);
}

export interface BatteryAccessoryQty {
  brackets: number;
  basePlates: number;
}

export function computeBatteryAccessories(moduleCount: number): BatteryAccessoryQty {
  if (moduleCount <= 0) return { brackets: 0, basePlates: 0 };
  return {
    brackets: Math.ceil(moduleCount / BATTERY_HOLDING_BRACKET.perNModules),
    basePlates: moduleCount * BATTERY_BASE_PLATE.perNModules,
  };
}

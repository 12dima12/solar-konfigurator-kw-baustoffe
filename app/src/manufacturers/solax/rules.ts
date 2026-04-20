import type { ManufacturerRules } from "../types";
import type { ConfigPhase, Lang } from "@/data/types";
import type { PhaseSelection } from "@/store/configStore";

function isX1Selected(selections: PhaseSelection[]): boolean {
  const inverter = selections.find((s) => s.phase === "inverter");
  if (!inverter) return false;
  return (
    inverter.steps.includes("Split System") &&
    inverter.steps.includes("Single-phase inverter X1")
  );
}

function isX3Selected(selections: PhaseSelection[]): boolean {
  const inverter = selections.find((s) => s.phase === "inverter");
  if (!inverter) return false;
  return (
    inverter.steps.includes("Split System") &&
    inverter.steps.includes("Three-phase inverter X3")
  );
}

const rules: ManufacturerRules = {
  filterOptions(
    phase: ConfigPhase,
    _lang: Lang,
    options: Record<string, unknown>
  ): Record<string, unknown> {
    // Backup phase: filter X1 vs X3 compatible backup units by product name prefix
    if (phase === "backup") {
      return options; // filtering happens implicitly via product names (X1/X3 prefix)
    }
    return options;
  },

  validateCombination(selections: PhaseSelection[]): { valid: boolean; reason?: string } {
    const x1 = isX1Selected(selections);
    const x3 = isX3Selected(selections);
    const backup = selections.find((s) => s.phase === "backup");

    if (backup?.selectedProduct) {
      const productName = backup.selectedProduct.product_name ?? "";
      const isX1Backup = productName.includes("X1");
      const isX3Backup = productName.includes("X3");

      if (x1 && isX3Backup) {
        return { valid: false, reason: "X1 inverter requires X1 backup unit" };
      }
      if (x3 && isX1Backup) {
        return { valid: false, reason: "X3 inverter requires X3 backup unit" };
      }
    }

    return { valid: true };
  },
};

export default rules;

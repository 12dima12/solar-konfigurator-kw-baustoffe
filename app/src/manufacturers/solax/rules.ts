import type { ManufacturerRules } from "../types";
import type { ConfigNode, ConfigPhase, Lang } from "@/data/types";
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

// Option key starts with "X1 …" or "X3 …"; anything else (section headings
// like "Yes"/"No") passes through.
function nameMatchesPhaseCount(key: string, node: ConfigNode, prefix: "X1" | "X3"): boolean {
  if (key.startsWith(prefix + " ")) return true;
  const productName = node.product_name ?? "";
  if (productName.includes(prefix)) return true;
  return false;
}

function isPhaseTaggedProduct(key: string, node: ConfigNode): boolean {
  if (key.startsWith("X1 ") || key.startsWith("X3 ")) return true;
  const productName = node.product_name ?? "";
  return productName.includes("X1") || productName.includes("X3");
}

const rules: ManufacturerRules = {
  filterOptions(
    phase: ConfigPhase,
    _lang: Lang,
    options: Array<[string, ConfigNode]>,
    selections: PhaseSelection[],
  ): Array<[string, ConfigNode]> {
    // Backup / Ersatzstromversorgung: a 3-phase inverter (X3) can only run
    // a 3-phase backup unit and vice versa. Hide phase-incompatible entries
    // entirely so the user can't pick them. Non-phase-tagged options
    // (e.g. "Yes"/"No" top-level choices) pass through unchanged.
    if (phase === "backup") {
      const x1 = isX1Selected(selections);
      const x3 = isX3Selected(selections);
      if (!x1 && !x3) return options;
      const keep: "X1" | "X3" = x3 ? "X3" : "X1";
      return options.filter(([key, node]) => {
        if (!isPhaseTaggedProduct(key, node)) return true;
        return nameMatchesPhaseCount(key, node, keep);
      });
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

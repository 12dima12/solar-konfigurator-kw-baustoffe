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

const warnedMissingPhaseTag = new Set<string>();

function warnMissingPhaseTag(phase: ConfigPhase, key: string, node: ConfigNode): void {
  if (process.env.NODE_ENV === "production") return;
  const warningKey = `${phase}:${key}:${node.product_name ?? ""}`;
  if (warnedMissingPhaseTag.has(warningKey)) return;
  warnedMissingPhaseTag.add(warningKey);
  console.warn(
    `[solax rules] Missing phaseType tag on backup option "${key}" (${node.product_name ?? "unknown product_name"}). Passing through by fallback.`,
  );
}

const rules: ManufacturerRules = {
  filterOptions(
    phase: ConfigPhase,
    _lang: Lang,
    options: Array<[string, ConfigNode]>,
    selections: PhaseSelection[],
  ): Array<[string, ConfigNode]> {
    // Backup / Ersatzstromversorgung:
    // - phase compatibility is controlled via explicit node.phaseType tags
    // - untagged nodes pass through intentionally (fallback), but produce a
    //   dev warning so catalog gaps can be fixed without blocking users
    if (phase === "backup") {
      const x1 = isX1Selected(selections);
      const x3 = isX3Selected(selections);
      if (!x1 && !x3) return options;
      const keep = x3 ? "x3" : "x1";
      return options.filter(([key, node]) => {
        if (!node.phaseType) {
          warnMissingPhaseTag(phase, key, node);
          return true;
        }
        return node.phaseType === keep;
      });
    }
    return options;
  },

  validateCombination(selections: PhaseSelection[]): { valid: boolean; reason?: string } {
    const x1 = isX1Selected(selections);
    const x3 = isX3Selected(selections);
    const backup = selections.find((s) => s.phase === "backup");

    if (backup?.selectedProduct) {
      const backupPhaseType = backup.selectedProduct.phaseType;
      const isX1Backup = backupPhaseType === "x1";
      const isX3Backup = backupPhaseType === "x3";

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

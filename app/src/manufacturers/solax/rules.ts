import type { ManufacturerRules } from "../types";
import type { ConfigNode, ConfigPhase, Lang, PhaseType } from "@/data/types";
import type { InstallationType, PhaseSelection } from "@/store/configStore";

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

function supportsInstallationType(
  key: string,
  node: ConfigNode,
  installationType: InstallationType,
): boolean {
  if (node.compatibility?.includes(installationType)) return true;
  if (node.children) {
    return Object.entries(node.children).some(([childKey, childNode]) =>
      supportsInstallationType(childKey, childNode, installationType)
    );
  }

  // Fallback heuristics for legacy catalog entries that are not yet tagged.
  if (installationType === "ac-coupling") {
    const haystack = `${key} ${node.product_name ?? ""} ${node.value ?? ""} ${node.description ?? ""}`.toLowerCase();
    return haystack.includes("hac") || haystack.includes("retrofit");
  }

  return true;
}

const rules: ManufacturerRules = {
  filterOptions(
    phase: ConfigPhase,
    _lang: Lang,
    options: Array<[string, ConfigNode]>,
    selections: PhaseSelection[],
    installationType: InstallationType | null,
  ): Array<[string, ConfigNode]> {
    let filtered = options;

    // AC-coupling mode exposes only explicitly compatible paths.
    // As a migration fallback we keep the original list if nothing matches
    // yet (so partially tagged trees stay usable while data is being enriched).
    if (installationType === "ac-coupling") {
      const acCompatible = options.filter(([key, node]) =>
        supportsInstallationType(key, node, "ac-coupling")
      );
      if (acCompatible.length > 0) {
        filtered = acCompatible;
      }
    }

    // Backup / Ersatzstromversorgung: an X1 inverter needs an X1 backup unit
    // and vice versa. Phase compatibility comes from explicit node.phaseType
    // tags; untagged nodes (e.g. "Yes"/"No" section headings) pass through
    // intentionally, with a dev warning when a leaf is missing the tag.
    if (phase === "backup") {
      const x1 = isX1Selected(selections);
      const x3 = isX3Selected(selections);
      if (!x1 && !x3) return filtered;
      const keep: PhaseType = x3 ? "x3" : "x1";
      return filtered.filter(([key, node]) => {
        if (!node.phaseType) {
          warnMissingPhaseTag(phase, key, node);
          return true;
        }
        return node.phaseType === keep;
      });
    }
    return filtered;
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

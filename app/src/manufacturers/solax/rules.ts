import type { ManufacturerRules } from "../types";
import type { ConfigNode, ConfigPhase, Lang, PhaseType } from "@/data/types";
import type { InstallationType, PhaseSelection } from "@/store/configStore";

// Primäre Quelle: der bestätigte Inverter-Leaf trägt `phaseType`. Erst wenn
// der User noch keinen Inverter bestätigt hat (oder ein Legacy-Produkt ohne
// Tag), fallen wir auf die Step-Pfad-Erkennung zurück. Der Fallback deckt
// nur den Split-System-Zweig ab; IES etc. laufen ausschließlich über den
// phaseType-Tag.
function getInverterPhaseType(selections: PhaseSelection[]): PhaseType | null {
  const inverter = selections.find((s) => s.phase === "inverter");
  if (!inverter) return null;
  const tagged = inverter.selectedProduct?.phaseType;
  if (tagged) return tagged;
  if (inverter.steps.includes("Split System")) {
    if (inverter.steps.includes("Single-phase inverter X1")) return "x1";
    if (inverter.steps.includes("Three-phase inverter X3")) return "x3";
  }
  return null;
}

function isX1Selected(selections: PhaseSelection[]): boolean {
  return getInverterPhaseType(selections) === "x1";
}

function isX3Selected(selections: PhaseSelection[]): boolean {
  return getInverterPhaseType(selections) === "x3";
}

const warnedMissingPhaseTag = new Set<string>();

// Nur auf echten Produkt-Leaves warnen (product_name gesetzt UND keine
// children). Strukturknoten wie "Yes" / "No" sind gewollt untagged und
// dürfen das Dev-Log nicht verrauschen — sonst gewöhnt man sich an die
// Warnung und übersieht echte Katalog-Lücken.
function warnMissingPhaseTag(phase: ConfigPhase, key: string, node: ConfigNode): void {
  if (process.env.NODE_ENV === "production") return;
  if (!node.product_name || node.children) return;
  const warningKey = `${phase}:${key}:${node.product_name}`;
  if (warnedMissingPhaseTag.has(warningKey)) return;
  warnedMissingPhaseTag.add(warningKey);
  console.warn(
    `[solax rules] Missing phaseType tag on backup product leaf "${key}" (${node.product_name}). Passing through by fallback.`,
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
    void installationType; // derzeit keine AC-Kopplung-Einschränkung aktiv
    let filtered = options;

    // Hinweis: Bis v2.7.14 lief hier ein AC-Kopplung-Compatibility-Filter,
    // der Optionen ohne `compatibility: ["ac-coupling"]` aussortiert hat.
    // Im Resultat sah der User in AC-Kopplung:
    //   - Backup: nur "Nein"
    //   - Wallbox: nur "Eine" (weil die Heuristik `"HAC"` im Namen matched,
    //     "Kein Ladegerät" aber rausfiel)
    // Das war gewollt als Retrofit-Semantik, der Kunde möchte aber die
    // volle Auswahl sehen (er entscheidet selbst, was er zur bestehenden
    // PV-Anlage hinzunimmt). Filter deaktiviert; die Katalog-Tags
    // `compatibility` bleiben als Metadata erhalten.

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

  // Safety net: die Kombinationen, die hier abgelehnt werden, sollten vom
  // filterOptions-Block oben bereits unerreichbar sein (die Option wird aus
  // dem Grid entfernt, bevor der User klicken kann). Die Prüfung bleibt für
  // korrupte persistierte States (z.B. alte Zustand-Snapshots nach einem
  // Katalog-Wechsel) und als letzte Verteidigungslinie.
  validateCombination(
    selections: PhaseSelection[],
    installationType?: InstallationType | null,
  ): { valid: boolean; reason?: string } {
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

      // AC-Kopplung erlaubt in der Backup-Phase nur die "No"-Option (kein
      // Backup). Wenn trotzdem ein Backup-Produkt als selectedProduct
      // persistiert ist (z.B. Modus-Wechsel nach der Auswahl), ist das
      // inkonsistent — echte Backup-Produkte tragen einen phaseType-Tag.
      // "No" hat keinen Tag und darf passieren.
      if (installationType === "ac-coupling" && backupPhaseType) {
        return {
          valid: false,
          reason: "AC coupling mode does not support a backup unit selection",
        };
      }
    }

    return { valid: true };
  },
};

export default rules;

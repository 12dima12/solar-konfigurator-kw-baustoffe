/**
 * Navigation
 *
 * Traversiert den rekursiven Produktbaum eines Hersteller-Katalogs.
 * Jeder Schritt im Konfigurator entspricht einem Key im Kinderknoten des aktuellen Knotens.
 *
 * Der `catalog`-Parameter ist pflicht — der frühere "fällt auf SolaX-Standard
 * zurück"-Default wurde in Batch D6 entfernt. Aufrufer beziehen ihn aus dem
 * `ManufacturerProvider`-Context (siehe ADR-007).
 */
import type { ConfigNode, ConfigPhase, Lang } from "@/data/types";

type RawCatalog = Record<string, Record<string, { tree: Record<string, unknown>; configuratorNext?: string }>>;

function asCatalog(catalog: Record<string, unknown>): RawCatalog {
  return catalog as unknown as RawCatalog;
}

/**
 * Gibt den Top-Level-Baum einer Phase zurück (z.B. alle Wechselrichter-Kategorien).
 */
export function getPhaseTree(
  phase: ConfigPhase,
  lang: Lang,
  catalog: Record<string, unknown>,
): Record<string, ConfigNode> | null {
  const data = asCatalog(catalog)[phase]?.[lang];
  if (!data?.tree) return null;
  return data.tree as Record<string, ConfigNode>;
}

/**
 * Berechnet den aktuellen Knoten im Produktbaum basierend auf den User-Steps.
 * @param steps - Array der bisher ausgewählten Keys (in Reihenfolge)
 * @returns Der aktuelle Knoten oder null, wenn Steps invalide sind
 */
export function resolveNode(
  phase: ConfigPhase,
  lang: Lang,
  steps: string[],
  catalog: Record<string, unknown>,
): ConfigNode | null {
  const tree = getPhaseTree(phase, lang, catalog);
  if (!tree) return null;

  let current: Record<string, ConfigNode> = tree;

  for (const step of steps) {
    const node = current[step];
    if (!node) return null;
    if (!node.children) return node;
    current = node.children as Record<string, ConfigNode>;
  }

  return { children: current } as ConfigNode;
}

export function getChildrenSorted(node: ConfigNode): Array<[string, ConfigNode]> {
  if (!node.children) return [];
  return Object.entries(node.children as Record<string, ConfigNode>).sort(
    ([, a], [, b]) => (a.priority ?? 999) - (b.priority ?? 999),
  );
}

export function isLeafNode(node: ConfigNode): boolean {
  // A node is a leaf iff it has no children tree to descend into. Some leaves
  // carry `value: null` on purpose — they are "opt-out" choices ("Nein", "Kein
  // Ladegerät", "No charger") that must still commit a selectedProduct so
  // skipPhase() can advance the wizard. Previously this branch wrongly treated
  // null-valued leaves as non-leaf, leaving the user stuck.
  return !node.children;
}

export function getNextPhase(
  phase: ConfigPhase,
  lang: Lang,
  catalog: Record<string, unknown>,
): string | null {
  const data = asCatalog(catalog)[phase]?.[lang];
  return data?.configuratorNext ?? null;
}

/**
 * Für die reguläre "Neue Installation" gilt die komplette Phasenkette
 * Inverter → Backup → Batterie → Wallbox → Zubehör.
 * AC-Kopplung (Retrofit) überspringt den Inverter-Schritt (die PV-Anlage
 * ist schon da), bietet dem Kunden aber weiterhin Batterie → Backup →
 * Wallbox → Zubehör an. Die Batterie steht bewusst VOR dem Backup, weil
 * beim Retrofit die Speicherwahl die zentrale Kauf-Entscheidung ist;
 * ein optionales Notstromgerät kommt im Anschluss (die Backup-Phase
 * filtert auf AC-kompatible Optionen, praktisch bleibt hier "Kein
 * Notstrom" übrig).
 */
export const DEFAULT_ACTIVE_PHASES: ConfigPhase[] = [
  "inverter",
  "backup",
  "battery",
  "wallbox",
  "accessory",
];

export const AC_COUPLING_PHASES: ConfigPhase[] = [
  "battery",
  "backup",
  "wallbox",
  "accessory",
];

export function getActivePhases(
  installationType: "new" | "ac-coupling" | null | undefined,
): ConfigPhase[] {
  return installationType === "ac-coupling" ? AC_COUPLING_PHASES : DEFAULT_ACTIVE_PHASES;
}

/** Back-compat alias — alter Code referenziert noch ACTIVE_PHASES. */
export const ACTIVE_PHASES = DEFAULT_ACTIVE_PHASES;

/**
 * Übersetzt die Step-Keys (die intern immer englisch sind, z.B. "Split System",
 * "Three-phase inverter X3", "Yes", "One", "Power 11") in ihre sprachspezifischen
 * Labels für die Breadcrumb-Anzeige. Fällt auf den Key zurück, wenn kein Label
 * am Knoten hängt. Operiert iterativ entlang der tatsächlichen Tree-Struktur —
 * so bekommt jeder Step das Label aus exakt dem Knoten, in den der User
 * hineingesprungen ist.
 */
export function resolveStepLabels(
  phase: ConfigPhase,
  lang: Lang,
  steps: string[],
  catalog: Record<string, unknown>,
): string[] {
  const tree = getPhaseTree(phase, lang, catalog);
  if (!tree) return steps;

  const labels: string[] = [];
  let current: Record<string, ConfigNode> | null = tree;
  for (const key of steps) {
    const node: ConfigNode | undefined = current?.[key];
    if (!node) {
      labels.push(key);
      current = null;
      continue;
    }
    labels.push(
      (typeof node.label === "string" && node.label) ||
        (typeof node.value === "string" && node.value) ||
        key,
    );
    current = (node.children as Record<string, ConfigNode> | undefined) ?? null;
  }
  return labels;
}

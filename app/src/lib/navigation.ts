/**
 * Navigation
 *
 * Traversiert den rekursiven Produktbaum eines Hersteller-Katalogs.
 * Jeder Schritt im Konfigurator entspricht einem Key im Kinderknoten des aktuellen Knotens.
 * Der optionale `catalog`-Parameter erlaubt hersteller-spezifische Kataloge (Phase 5+).
 */
import type { ConfigNode, ConfigPhase, Lang } from "@/data/types";
import defaultCatalogJson from "@/data/catalog.json";

type RawCatalog = Record<string, Record<string, { tree: Record<string, unknown> }>>;
const defaultCatalog = defaultCatalogJson as unknown as RawCatalog;

function getCatalog(catalog?: Record<string, unknown> | null): RawCatalog {
  return (catalog as unknown as RawCatalog) ?? defaultCatalog;
}

/**
 * Gibt den Top-Level-Baum einer Phase zurück (z.B. alle Wechselrichter-Kategorien).
 * @param catalog - Optionaler Hersteller-Katalog; fällt auf SolaX-Standard zurück.
 */
export function getPhaseTree(
  phase: ConfigPhase,
  lang: Lang,
  catalog?: Record<string, unknown> | null
): Record<string, ConfigNode> | null {
  const data = getCatalog(catalog)[phase]?.[lang];
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
  catalog?: Record<string, unknown> | null
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
    ([, a], [, b]) => (a.priority ?? 999) - (b.priority ?? 999)
  );
}

export function isLeafNode(node: ConfigNode): boolean {
  return !!node.product_code || (!node.children && node.value !== null);
}

export function getNextPhase(
  phase: ConfigPhase,
  lang: Lang,
  catalog?: Record<string, unknown> | null
): string | null {
  const data = getCatalog(catalog)[phase]?.[lang];
  return (data as { configuratorNext?: string })?.configuratorNext ?? null;
}

export const ACTIVE_PHASES: ConfigPhase[] = ["inverter", "backup", "battery", "wallbox"];

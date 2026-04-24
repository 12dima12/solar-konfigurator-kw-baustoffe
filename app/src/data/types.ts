export type ConfigPhase = "inverter" | "backup" | "battery" | "wallbox" | "accessory" | "finish";
export type PhaseType = "x1" | "x3";

/**
 * Innerhalb einer Phase unterscheidet `inverterLine` zwischen der klassischen
 * SolaX-Hybrid-Serie (G4 Hybrid / HYB-P / X1 Hybrid) und der IES-Serie.
 * Beide arbeiten 3-phasig (phaseType="x3"), brauchen aber unterschiedliche
 * Notstrom-Boxen: Hybrid → X3 EPS Box / Matebox Advanced, IES → X3 EPS PBOX 60 kW.
 * Ultra-Wechselrichter bleiben vorerst untagged, weil die domänenspezifische
 * Backup-Zuordnung zusätzlich kalibriert werden muss.
 */
export type InverterLine = "hybrid" | "ies";

export interface InfoSpec {
  title: string;
  specs: Array<{ label?: string; value: string }>;
}
export type Lang = "de" | "en" | "cs";

export interface ConfigNode {
  value?: string;
  label?: string;
  title?: string | null;
  icon?: string | null;
  description?: string | null;
  image?: string | null;
  cover?: string | null;
  info?: InfoSpec | null;
  product_name?: string;
  priority?: number;
  power?: number;
  type?: string;
  group?: string | null;
  compatibility?: Array<"new" | "ac-coupling">;
  phaseType?: PhaseType;
  inverterLine?: InverterLine;
  children?: Record<string, ConfigNode>;
}

export interface ConfigTree {
  configuratorId: string;
  configuratorNext: string;
  titlesByPath?: Record<string, string>;
  dynamicTitles?: unknown[];
  iconsByPath?: unknown[];
  imagesByPath?: unknown[];
  descriptionsByPath?: unknown[];
  tree: Record<string, ConfigNode> | Record<string, string>;
}

export type PhaseCatalog = Record<Lang, ConfigTree>;

export interface Catalog {
  inverter: PhaseCatalog;
  backup: PhaseCatalog;
  battery: PhaseCatalog;
  wallbox: PhaseCatalog;
  accessory: Partial<PhaseCatalog>;
  finish: Partial<PhaseCatalog>;
}

export interface FlatProduct {
  phase: ConfigPhase;
  path: string[];
  product_name: string;
  value: string;
  label: string;
  description?: string | null;
  image?: string | null;
  info?: InfoSpec | null;
  priority?: number;
  power?: number;
  type?: string;
  group?: string | null;
  available_in_langs: Lang[];
}

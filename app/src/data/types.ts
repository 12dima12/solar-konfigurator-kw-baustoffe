export type ConfigPhase = "inverter" | "backup" | "battery" | "wallbox" | "accessory" | "finish";
export type PhaseType = "x1" | "x3";

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

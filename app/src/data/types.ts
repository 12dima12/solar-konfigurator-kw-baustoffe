export type ConfigPhase = "inverter" | "backup" | "battery" | "wallbox" | "accessory" | "finish";
export type Lang = "de" | "en" | "cs";

export interface StockInfo {
  totalAvailable: number;
  totalOrdered: number;
}

export interface ConfigNode {
  value?: string;
  label?: string;
  title?: string | null;
  icon?: string | null;
  description?: string | null;
  image?: string | null;
  cover?: string | null;
  info?: string | null;
  product_code?: string;
  product_name?: string;
  stock?: StockInfo;
  priority?: number;
  power?: number;
  type?: string;
  group?: string | null;
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
  product_code: string;
  product_name: string;
  value: string;
  label: string;
  description?: string | null;
  image?: string | null;
  info?: string | null;
  stock?: StockInfo;
  priority?: number;
  power?: number;
  type?: string;
  group?: string | null;
  available_in_langs: Lang[];
}

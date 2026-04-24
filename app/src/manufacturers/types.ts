import { z } from "zod";
import type { ConfigNode, ConfigPhase, Lang } from "@/data/types";
import type { InstallationType, PhaseSelection } from "@/store/configStore";

export const ManufacturerMetaSchema = z.object({
  slug: z.string().min(1),
  displayName: z.string().min(1),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  logoUrl: z.string().min(1),
  supportedPhases: z.array(z.string()).min(1),
  defaultLang: z.enum(["de", "en", "cs"]).default("de"),
});

export type ManufacturerMeta = z.infer<typeof ManufacturerMetaSchema>;

export interface ManufacturerRules {
  /**
   * Applied to the sorted [key, ConfigNode] list before it reaches the
   * option grid. Use this to hide options that are electrically
   * incompatible with earlier selections (e.g. X1 backup units when an
   * X3 inverter was picked) so the user can't even click them.
   */
  filterOptions(
    phase: ConfigPhase,
    lang: Lang,
    options: Array<[string, ConfigNode]>,
    selections: PhaseSelection[],
    installationType: InstallationType | null
  ): Array<[string, ConfigNode]>;
  validateCombination(
    selections: PhaseSelection[],
    installationType?: InstallationType | null
  ): { valid: boolean; reason?: string };
}

export interface Manufacturer {
  meta: ManufacturerMeta;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalog: Record<string, any>;
  rules: ManufacturerRules;
}

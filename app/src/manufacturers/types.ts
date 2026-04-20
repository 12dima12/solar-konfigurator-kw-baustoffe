import { z } from "zod";
import type { ConfigPhase, Lang } from "@/data/types";
import type { PhaseSelection } from "@/store/configStore";

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
  filterOptions(
    phase: ConfigPhase,
    lang: Lang,
    options: Record<string, unknown>
  ): Record<string, unknown>;
  validateCombination(selections: PhaseSelection[]): { valid: boolean; reason?: string };
}

export interface Manufacturer {
  meta: ManufacturerMeta;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalog: Record<string, any>;
  rules: ManufacturerRules;
}

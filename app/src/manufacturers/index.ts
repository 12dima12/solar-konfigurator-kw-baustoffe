import type { Manufacturer } from "./types";
import solax from "./solax";

// Registry: add new manufacturers here — one entry = one new configurator
const MANUFACTURERS: Record<string, Manufacturer> = {
  solax,
};

export function getManufacturer(slug: string): Manufacturer | null {
  return MANUFACTURERS[slug] ?? null;
}

export function listManufacturers(): Manufacturer[] {
  return Object.values(MANUFACTURERS);
}

export { MANUFACTURERS };
export type { Manufacturer };

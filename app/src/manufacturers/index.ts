/**
 * Manufacturer Registry
 *
 * Zentrale Liste aller integrierten Hersteller. Neuen Hersteller hinzufügen:
 * 1. Ordner unter src/manufacturers/<slug>/ anlegen (Vorlage: _template/)
 * 2. Hier importieren + in MANUFACTURERS eintragen
 * 3. Auch in rules-registry.ts eintragen
 * Detaillierte Anleitung: docs/ADD_MANUFACTURER.md
 */
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

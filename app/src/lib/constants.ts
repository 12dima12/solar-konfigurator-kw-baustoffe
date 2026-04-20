export const PHASES = ["inverter", "backup", "battery", "wallbox"] as const;
export type ActivePhase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<string, { de: string; en: string; cs: string }> = {
  inverter: { de: "Wechselrichter", en: "Inverter", cs: "Střídač" },
  backup: { de: "Notstrom", en: "Backup", cs: "Záloha" },
  battery: { de: "Batterie", en: "Battery", cs: "Baterie" },
  wallbox: { de: "Wallbox", en: "Wallbox", cs: "Wallbox" },
};

export const LOCALES = ["de", "en", "cs"] as const;
export type Locale = (typeof LOCALES)[number];

export const POWER_STOPS_X3 = [5, 6, 8, 10, 12, 15, 20, 25, 30] as const;
export const POWER_OVER_30_KEY = "> 30.0 kW";

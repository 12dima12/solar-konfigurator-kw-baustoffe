import type { ManufacturerMeta } from "../types";

// Copy this file to src/manufacturers/<slug>/meta.ts and fill in the values.
const meta: ManufacturerMeta = {
  slug: "example",
  displayName: "Example Solar",
  accentColor: "#005500",
  logoUrl: "/kw-logo.svg",
  supportedPhases: ["inverter", "backup", "battery", "wallbox"],
  defaultLang: "de",
};

export default meta;

import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dir, "../recon/data");

const phases = ["inverter", "backup", "battery", "wallbox", "accessory", "finish"];
const langs = ["de", "en", "cs"];

const catalog = {};

for (const phase of phases) {
  catalog[phase] = {};
  for (const lang of langs) {
    const file = join(dataDir, `${phase}_${lang}.json`);
    try {
      const raw = readFileSync(file, "utf8");
      catalog[phase][lang] = JSON.parse(raw);
    } catch {
      catalog[phase][lang] = null;
    }
  }
}

const outPath = join(__dir, "catalog.json");
writeFileSync(outPath, JSON.stringify(catalog, null, 2));
console.log(`catalog.json written to ${outPath}`);

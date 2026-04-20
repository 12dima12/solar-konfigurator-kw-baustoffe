#!/usr/bin/env node
// Prebuild check: validates all manufacturer meta files against the schema.
// Fails loudly if any field is missing or invalid — prevents silent config errors at runtime.

import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manufacturersDir = join(__dirname, "../src/manufacturers");

const REQUIRED_FIELDS = ["slug", "displayName", "accentColor", "logoUrl", "supportedPhases", "defaultLang"];
const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
const VALID_LANGS = ["de", "en", "cs"];

let errors = 0;

const entries = await readdir(manufacturersDir, { withFileTypes: true });
const folders = entries.filter(
  (e) => e.isDirectory() && !e.name.startsWith("_")
);

if (folders.length === 0) {
  console.error("❌  No manufacturer folders found in src/manufacturers/");
  process.exit(1);
}

for (const folder of folders) {
  const slug = folder.name;
  const metaPath = join(manufacturersDir, slug, "meta.ts");

  let metaSource;
  try {
    metaSource = await readFile(metaPath, "utf-8");
  } catch {
    console.error(`❌  [${slug}] meta.ts not found`);
    errors++;
    continue;
  }

  // Lightweight field presence check (no TS execution needed)
  for (const field of REQUIRED_FIELDS) {
    if (!metaSource.includes(field + ":") && !metaSource.includes(`"${field}"`)) {
      console.error(`❌  [${slug}] meta.ts missing field: ${field}`);
      errors++;
    }
  }

  // Check accentColor format
  const colorMatch = metaSource.match(/accentColor:\s*["']([^"']+)["']/);
  if (colorMatch && !COLOR_RE.test(colorMatch[1])) {
    console.error(`❌  [${slug}] accentColor must be a 6-digit hex color, got: ${colorMatch[1]}`);
    errors++;
  }

  // Check defaultLang
  const langMatch = metaSource.match(/defaultLang:\s*["']([^"']+)["']/);
  if (langMatch && !VALID_LANGS.includes(langMatch[1])) {
    console.error(`❌  [${slug}] defaultLang must be one of: ${VALID_LANGS.join(", ")}, got: ${langMatch[1]}`);
    errors++;
  }

  // Check catalog.json exists
  const catalogPath = join(manufacturersDir, slug, "catalog.json");
  try {
    const catalog = JSON.parse(await readFile(catalogPath, "utf-8"));
    const phases = Object.keys(catalog);
    if (phases.length === 0) {
      console.error(`❌  [${slug}] catalog.json has no phases`);
      errors++;
    } else {
      console.log(`✓  [${slug}] catalog.json — phases: ${phases.join(", ")}`);
    }
  } catch {
    console.error(`❌  [${slug}] catalog.json not found or invalid JSON`);
    errors++;
  }

  if (errors === 0) {
    console.log(`✓  [${slug}] meta.ts — OK`);
  }
}

if (errors > 0) {
  console.error(`\n${errors} validation error(s). Fix before building.\n`);
  process.exit(1);
} else {
  console.log(`\n✓  All ${folders.length} manufacturer(s) validated.\n`);
}

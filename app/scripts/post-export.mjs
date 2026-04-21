/**
 * Post-Export-Schritt
 *
 * Next.js erzeugt mit output:'export' den ./out/-Ordner.
 * Dieses Skript erzeugt ein Manifest, das das WordPress-Plugin (Phase 10+)
 * lädt, um pro (manufacturer, route) den korrekten HTML-Entry zu finden.
 *
 * Die Manufacturer-Liste ist NICHT hardcoded — stattdessen wird
 * src/manufacturers/ als Source of Truth gelesen. Für jeden Ordner
 * (außer `_template`) muss der Build eine configurator/ und embed/
 * index.html erzeugt haben, sonst bricht das Skript ab.
 */

import { access, readdir, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_DIR            = resolve(__dirname, "..");
const OUT_DIR            = resolve(APP_DIR, "out");
const MANUFACTURERS_DIR  = resolve(APP_DIR, "src/manufacturers");

const ROUTES = ["configurator", "embed"];

async function collectFiles(dir, prefix = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const path = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      files.push(...(await collectFiles(join(dir, e.name), path)));
    } else {
      files.push(path);
    }
  }
  return files;
}

async function fileExists(path) {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function listManufacturerSlugs() {
  const entries = await readdir(MANUFACTURERS_DIR, { withFileTypes: true });
  return entries
    .filter((e) => e.isDirectory() && !e.name.startsWith("_"))
    .map((e) => e.name)
    .sort();
}

async function buildEntries(slugs) {
  const entries = {};
  const missing = [];

  for (const slug of slugs) {
    for (const route of ROUTES) {
      const rel = `${slug}/${route}/index.html`;
      const abs = join(OUT_DIR, rel);
      if (await fileExists(abs)) {
        entries[`${slug}-${route}`] = rel;
      } else {
        missing.push(rel);
      }
    }
  }

  return { entries, missing };
}

async function main() {
  console.log("[post-export] Generating manifest...");

  const slugs = await listManufacturerSlugs();
  if (slugs.length === 0) {
    throw new Error("No manufacturer folders found in src/manufacturers/");
  }

  const { entries, missing } = await buildEntries(slugs);
  if (missing.length > 0) {
    throw new Error(
      `Next.js export missing HTML entries for: ${missing.join(", ")}\n` +
      `Ensure that src/app/[manufacturer]/(configurator|embed)/page.tsx is built for every registered manufacturer.`
    );
  }

  const files = await collectFiles(OUT_DIR);

  const manifest = {
    generatedAt: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    manufacturers: slugs,
    entries,
    assets: files.filter((f) => f.startsWith("_next/")),
  };

  await writeFile(
    join(OUT_DIR, "kw-pv-tools-manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(
    `[post-export] Done. ${files.length} files, ${slugs.length} manufacturer(s): ${slugs.join(", ")}`
  );
}

main().catch((e) => {
  console.error("[post-export] Error:", e.message ?? e);
  process.exit(1);
});

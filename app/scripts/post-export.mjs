/**
 * Post-Export-Schritt
 *
 * Next.js erzeugt mit output:'export' den ./out/-Ordner.
 * Dieses Skript erzeugt ein Manifest mit allen Bundle-Dateien,
 * das das WordPress-Plugin (Phase 10) benötigt.
 */

import { readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const OUT_DIR = "./out";

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

async function main() {
  console.log("[post-export] Generating manifest...");

  const files = await collectFiles(OUT_DIR);
  const manifest = {
    generatedAt: new Date().toISOString(),
    version: process.env.npm_package_version ?? "1.0.0",
    entries: {
      "solax-configurator": "solax/configurator/index.html",
      "solax-embed": "solax/embed/index.html",
    },
    assets: files.filter((f) => f.startsWith("_next/")),
  };

  await writeFile(
    join(OUT_DIR, "kw-pv-tools-manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`[post-export] Done. ${files.length} files, manifest written.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

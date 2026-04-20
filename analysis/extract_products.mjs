import { readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dir, "../recon/data");

const phases = ["inverter", "backup", "battery", "wallbox"];
const langs = ["de", "en", "cs"];

function loadTree(phase, lang) {
  try {
    return JSON.parse(readFileSync(join(dataDir, `${phase}_${lang}.json`), "utf8"));
  } catch {
    return null;
  }
}

function extractLeaves(node, path, results, phase) {
  if (!node || typeof node !== "object") return;

  if (node.product_code) {
    results.push({ phase, path: [...path], node });
    return;
  }

  const children = node.children;
  if (children && typeof children === "object") {
    for (const [key, child] of Object.entries(children)) {
      extractLeaves(child, [...path, key], results, phase);
    }
  }
}

const allProducts = [];

for (const phase of phases) {
  const deTrees = loadTree(phase, "de");
  if (!deTrees) continue;

  const tree = deTrees.tree;

  // battery is flat Record<string, string> — skip (no product_codes)
  if (phase === "battery") continue;

  const leaves = [];
  for (const [key, child] of Object.entries(tree)) {
    extractLeaves(child, [key], leaves, phase);
  }

  for (const { path, node } of leaves) {
    const product = {
      phase,
      path,
      product_code: node.product_code,
      product_name: node.product_name,
      value: node.value ?? null,
      label: node.label ?? null,
      description: node.description ?? null,
      image: node.image ?? null,
      info: node.info ?? null,
      stock: node.stock ?? null,
      priority: node.priority ?? null,
      power: node.power ?? null,
      type: node.type ?? null,
      group: node.group ?? null,
      available_in_langs: [],
    };

    // Check which languages have this product_code
    for (const lang of langs) {
      const langTree = loadTree(phase, lang);
      if (!langTree) continue;
      const langLeaves = [];
      for (const [key, child] of Object.entries(langTree.tree)) {
        extractLeaves(child, [key], langLeaves, phase);
      }
      if (langLeaves.some((l) => l.node.product_code === node.product_code)) {
        product.available_in_langs.push(lang);
      }
    }

    allProducts.push(product);
  }
}

const outPath = join(__dir, "products.json");
writeFileSync(outPath, JSON.stringify(allProducts, null, 2));
console.log(`products.json: ${allProducts.length} products written to ${outPath}`);

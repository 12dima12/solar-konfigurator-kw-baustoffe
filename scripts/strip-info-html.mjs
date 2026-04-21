#!/usr/bin/env node
/**
 * Converts legacy HTML `info` strings in catalog.json to structured InfoSpec objects.
 *
 * Input:  "<h2 class='...'>Title</h2><ul><li><span class='font-medium'>Label:</span> Value</li></ul>"
 * Output: { title: "Title", specs: [{ label: "Label", value: "Value" }, ...] }
 *
 * Runs automatically as part of `pnpm build` and after `refresh-solax.sh`.
 * Safe to run multiple times — already-converted InfoSpec objects are left untouched.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CATALOG_PATH = resolve(__dirname, "../app/src/manufacturers/solax/catalog.json");

function stripTags(html) {
  return html.replace(/<[^>]*>/g, "").trim();
}

function parseInfoHtml(html) {
  if (!html || typeof html !== "string") return null;

  // Extract h2 title
  const titleMatch = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i);
  const title = titleMatch ? stripTags(titleMatch[1]).replace(/\s+/g, " ").trim() : "";

  // Extract li items
  const specs = [];
  const liRegex = /<li>([\s\S]*?)<\/li>/gi;
  let liMatch;
  while ((liMatch = liRegex.exec(html)) !== null) {
    const liContent = liMatch[1];
    // Check for <span class='font-medium'>Label:</span> Value pattern
    const spanMatch = liContent.match(/<span[^>]*>([\s\S]*?)<\/span>([\s\S]*)/i);
    if (spanMatch) {
      const label = stripTags(spanMatch[1]).replace(/:$/, "").trim();
      const value = stripTags(spanMatch[2]).replace(/^\s*/, "").trim();
      if (label || value) specs.push({ label: label || undefined, value });
    } else {
      const value = stripTags(liContent).trim();
      if (value) specs.push({ value });
    }
  }

  if (!title && specs.length === 0) return null;
  return { title, specs };
}

function convertNode(node) {
  if (!node || typeof node !== "object") return node;

  // Already converted (InfoSpec has title + specs)
  if (node.info && typeof node.info === "object" && "title" in node.info) return node;

  const converted = { ...node };
  if (typeof node.info === "string") {
    converted.info = parseInfoHtml(node.info);
  }
  if (node.children && typeof node.children === "object") {
    converted.children = Object.fromEntries(
      Object.entries(node.children).map(([k, v]) => [k, convertNode(v)])
    );
  }
  return converted;
}

function convertCatalog(catalog) {
  if (!catalog || typeof catalog !== "object") return catalog;
  const result = {};
  for (const [phase, phaseCatalog] of Object.entries(catalog)) {
    result[phase] = {};
    for (const [lang, configTree] of Object.entries(phaseCatalog)) {
      if (!configTree || !configTree.tree) {
        result[phase][lang] = configTree;
        continue;
      }
      // tree is Record<string, ConfigNode>, not a ConfigNode itself — iterate top-level keys
      result[phase][lang] = {
        ...configTree,
        tree: Object.fromEntries(
          Object.entries(configTree.tree).map(([k, v]) => [k, convertNode(v)])
        ),
      };
    }
  }
  return result;
}

const catalog = JSON.parse(readFileSync(CATALOG_PATH, "utf-8"));
const converted = convertCatalog(catalog);
writeFileSync(CATALOG_PATH, JSON.stringify(converted, null, 2) + "\n", "utf-8");
console.log("[strip-info-html] catalog.json converted — no more HTML in info fields.");

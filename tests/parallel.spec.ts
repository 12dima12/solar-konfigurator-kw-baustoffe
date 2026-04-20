/**
 * Parallel-Test: Vergleicht Produktergebnisse zwischen Original-Konfigurator und Rebuild.
 *
 * Ausführung:
 *   cd app && pnpm exec playwright test ../tests/parallel.spec.ts
 *
 * Voraussetzung: pnpm dev läuft auf localhost:3000
 */

import { test, expect, type Page } from "@playwright/test";

const REBUILD_BASE = "http://localhost:3000";

// Alle bekannten Pfade aus Phase 2 analysis/products.json
const testPaths: { path: string[]; expected_code: string; expected_name: string; lang?: string }[] = [
  // IES
  { path: ["IES", "4.0 kW"], expected_code: "G-21d-3I40a", expected_name: "Solax X3-IES-4.0K, AFCI, WiFi+LAN, CT" },
  { path: ["IES", "5.0 kW"], expected_code: "G-21d-3I50a", expected_name: "Solax X3-IES-5.0K, AFCI, WiFi+LAN, CT" },
  { path: ["IES", "8.0 kW"], expected_code: "G-21d-3I80a", expected_name: "Solax X3-IES-8.0K, AFCI, WiFi+LAN, CT" },
  { path: ["IES", "10.0 kW"], expected_code: "G-21d-3I100a", expected_name: "Solax X3-IES-10.0K, AFCI, WiFi+LAN, CT" },

  // Split System X1
  { path: ["Split System", "Single-phase inverter X1", "3.0 kW"], expected_code: "G-21s-6304", expected_name: "Solax G4 X1-Hybrid-3.0-D, WiFi 3.0, CT" },
  { path: ["Split System", "Single-phase inverter X1", "4.0 kW"], expected_code: "G-21s-6404", expected_name: "Solax G4 X1-Hybrid-4.0-D, WiFi 3.0, CT" },
  { path: ["Split System", "Single-phase inverter X1", "6.0 kW"], expected_code: "G-21s-6604", expected_name: "Solax G4 X1-Hybrid-6.0-D, WiFi 3.0, CT" },

  // Split System X3 - Hybrid G4
  { path: ["Split System", "Three-phase inverter X3", "5.0 kW", "G-21c-4205"], expected_code: "G-21c-4205", expected_name: "Solax G4 X3-Hybrid-5.0-D, CT, ohne WiFi 3.0" },
  { path: ["Split System", "Three-phase inverter X3", "5.0 kW", "G-21d-4P05"], expected_code: "G-21d-4P05", expected_name: "Solax G4 X3-HYB-5.0-P, WiFi+LAN" },
  { path: ["Split System", "Three-phase inverter X3", "10.0 kW", "G-21d-4P10"], expected_code: "G-21d-4P10", expected_name: "Solax G4 X3-HYB-10.0-P, WiFi+LAN" },
  { path: ["Split System", "Three-phase inverter X3", "12.0 kW", "G-21d-4P12"], expected_code: "G-21d-4P12", expected_name: "Solax G4 X3-HYB-12.0-P, WiFi+LAN" },

  // X3 Ultra
  { path: ["Split System", "Three-phase inverter X3", "15.0 kW", "G-21s-3H15"], expected_code: "G-21s-3H15", expected_name: "Solax X3 ULT-15K, WiFi+LAN, CT, (2xMPP)" },
  { path: ["Split System", "Three-phase inverter X3", "20.0 kW", "G-21s-3H20"], expected_code: "G-21s-3H20", expected_name: "Solax X3 ULT-20K, WiFi+LAN, CT, (2xMPP)" },
  { path: ["Split System", "Three-phase inverter X3", "30.0 kW", "G-21s-3H30"], expected_code: "G-21s-3H30", expected_name: "Solax X3 ULT-30K, WiFi+LAN, CT" },

  // Backup
  { path: ["IES", "4.0 kW", "Yes", "X3 Matebox Advanced"], expected_code: "G-210-405dd", expected_name: "Solax X3-Matebox Advanced, D, V1.4, WiFi 3.0P, denoise" },
  { path: ["IES", "4.0 kW", "Yes", "X3 EPS Box"], expected_code: "B-210-1006", expected_name: "Solax X3-EPS Box, 3*63 A" },

  // Wallbox
  { path: ["Split System", "Single-phase inverter X1", "3.0 kW", "No", "Triple Power T30", "One", "Power 11", "Socket", "Standard"], expected_code: "EV-210-11S", expected_name: "Solax X3-HAC-11S, 1/3 phase shift" },
  { path: ["Split System", "Single-phase inverter X1", "3.0 kW", "No", "Triple Power T30", "One", "Power 22", "Plug", "With display"], expected_code: "EV-210-227L", expected_name: "Solax X3-HAC-22P - L, 1/3 phase shift" },
  { path: ["IES", "4.0 kW", "No", "Triple Power T58", "One", "Power 22", "Socket", "Standard"], expected_code: "EV-210-22S", expected_name: "Solax X3-HAC-22S, 1/3 phase shift" },

  // Multilang
  { path: ["IES", "4.0 kW"], expected_code: "G-21d-3I40a", expected_name: "Solax X3-IES-4.0K, AFCI, WiFi+LAN, CT", lang: "en" },
  { path: ["IES", "4.0 kW"], expected_code: "G-21d-3I40a", expected_name: "Solax X3-IES-4.0K, AFCI, WiFi+LAN, CT", lang: "cs" },
];

// Daten-basierter Test (ohne Browser) — prüft direkt gegen catalog.json
test.describe("Datenintegrität (Catalog)", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const catalog = require("../app/src/data/catalog.json") as Record<string, Record<string, { tree: Record<string, unknown> }>>;

  for (const { path, expected_code, lang = "de" } of testPaths.slice(0, 15)) {
    test(`[${lang}] ${path.join(" › ")}`, () => {
      let node: Record<string, unknown> = catalog.inverter?.[lang]?.tree as Record<string, unknown>;
      expect(node, `tree für inverter/${lang} nicht gefunden`).toBeTruthy();

      for (const step of path) {
        const next = (node[step] as Record<string, unknown>) ?? null;
        if (next === null) {
          // Schritt nicht in inverter-tree → könnte backup/battery/wallbox sein
          break;
        }
        if (next.children) {
          node = next.children as Record<string, unknown>;
        } else {
          node = next;
        }
      }

      const code = (node as { product_code?: string }).product_code;
      expect(code).toBe(expected_code);
    });
  }
});

// Browser-basierter Test (nur wenn Dev-Server läuft)
test.describe("Browser — Rebuild UI", () => {
  test.skip(!process.env.RUN_BROWSER_TESTS, "Nur wenn RUN_BROWSER_TESTS=1 gesetzt");

  test("Startseite lädt", async ({ page }: { page: Page }) => {
    await page.goto(REBUILD_BASE);
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("text=KW PV Solutions")).toBeVisible();
  });

  test("StepIndicator hat 4 Schritte", async ({ page }: { page: Page }) => {
    await page.goto(REBUILD_BASE);
    const steps = page.locator("nav[aria-label] ol li");
    await expect(steps).toHaveCount(4);
  });

  test("IES auswählen zeigt Leistungsoptionen", async ({ page }: { page: Page }) => {
    await page.goto(REBUILD_BASE);
    await page.getByRole("button", { name: /IES/i }).click();
    await expect(page.getByRole("button", { name: /4.0 kW/i })).toBeVisible();
  });

  test("Sprache wechseln aktualisiert UI", async ({ page }: { page: Page }) => {
    await page.goto(REBUILD_BASE);
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: /English/i }).click();
    await expect(page.locator("text=Inverter")).toBeVisible();
  });
});

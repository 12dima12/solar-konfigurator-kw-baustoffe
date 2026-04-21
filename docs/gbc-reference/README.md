# GBC Solino Reference Mirror

Archive of all publicly accessible files from the reference configurator
<https://ops.gbc-solino.at/solax-konfigurator/>. Used as the source of truth
for battery montage tables, article codes, and wizard navigation flow.

## How it was obtained

The site is a server-side Vue app; no admin surface or API auth was
bypassed. Everything here came from ordinary GET/POST requests against the
public endpoints, captured with `curl` using a standard PHPSESSID cookie:

1. `inc/filter-config-refactored.php?configFile=<cf>&lang=<l>` returns the
   raw tree JSON for each wizard phase (inverter / backup / battery /
   wallbox).
2. `inc/battery_slider.php` with `POST body battery=<series>` returns the
   battery-detail page whose inline `<script>` block contains the authoritative
   `const batteryData = {...}` JSON — the full kWh → part-list lookup.
3. The wizard itself is driven by a small number of hidden-form POSTs
   (`final_value`, `product_code`, `product_name`, `configurator`,
   `configuratorNext`, `steps`). We replay them to reach each phase and save
   the response HTML under `phases/`.

Total: 80 files, ~3 MB.

## Directory layout

```
configs/            tree JSON per phase × language (DE/EN/CS)
inc/                PHP-rendered partials that ship HTML+JS with logic inline
  battery_slider.php  slider UI with the const batteryData per-series table
  accessory.php       zubehör form (dongle/adapter-box/meter/pedestal/xhub)
  menu.php            wizard progress breadcrumbs
  head.php            doctype + head partial
  finish.php          placeholder shown when steps are incomplete
phases/             full HTML responses for 4 scenarios × 7 wizard steps
img/                25 product images referenced from the inline JS
index.html          landing page ("Installation Type")
output.css          Tailwind-built stylesheet served by the site
```

## What we extracted from it

- **battery_slider.php inline data** → `app/src/manufacturers/solax/battery-series.ts`:
  every MontageEntry for T58, S25/S36 (HS25 + HS36 auto-split), T30, including
  the "2× variants per kWh" paths (e.g. `34.6 kWh T58` has all-slave-with-
  BMS-Parallel-Box-G1 vs. master-with-BMS-Parallel-Box-G2).
- **accessory.php field names + values** → `class-article-codes.php`:
  authoritative SolaX article codes for every dongle, adapter, meter,
  pedestal and battery-mount accessory.
- **filter-config-refactored.php output** → verifies our `catalog.json`
  structure matches the GBC tree for inverter/backup/wallbox.

## Keeping it current

Re-run the same curl sequence when GBC ships updates. The wizard's server-
side state machine lives in PHP-side files we cannot download, so the HTML
outputs under `phases/` are the best proxy for behavioural regressions.

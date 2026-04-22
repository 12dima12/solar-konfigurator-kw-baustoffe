"use client";
import Image from "next/image";
import { publicAsset } from "@/lib/public-asset";

/**
 * Renders the stacked / side-by-side product images for one montage part
 * — matching the layout rules in GBC's inc/battery_slider.php
 * renderStackedImages() + the per-model column-split logic.
 */

interface Props {
  model: string;
  partLabel: string;
  count: number;
}

// 1:1 GBC mapping: getImgFile(model, key) in battery_slider.php
function imagePath(model: string, partLabel: string): string {
  const m = model;
  switch (partLabel) {
    case "Master": return "/products/battery-parts/master.png";
    case "Slave":  return "/products/battery-parts/slave.png";
    case "BMS Parallel Box G1":
    case "BMS Parallel Box G2":
      return "/products/battery-parts/parallel-box.png";
    case "BMS":
      if (m === "T30") return "/products/battery-parts/t30-bms.png";
      if (m === "HS50E-D") return "/products/battery-parts/ies-bms.png";
      return "/products/battery-parts/hs-bms.png";
    case "BAT BOX":
      if (m === "T30") return "/products/battery-parts/t30-bat-box.png";
      if (m === "HS50E-D") return "/products/battery-parts/ies-bat-box.png";
      return "/products/battery-parts/hs-bat-box.png";
    case "Series BOX":
      if (m === "HS50E-D") return "/products/battery-parts/ies-series-box.png";
      return "/products/battery-parts/hs-series-box.png";
  }
  return "";
}

// Exact column split GBC uses in renderComponentsBlock for BAT BOX stacks
function columns(count: number, model: string): number[] {
  if (model === "HS50E-D") {
    if (count === 4) return [2, 2];
    if (count === 5) return [3, 2];
    if (count === 6) return [3, 3];
    return [count];
  }
  if (count <= 9) return [count];
  let first = Math.ceil(count / 2);
  if (count === 10) first = 5;
  if (count === 11 || count === 12) first = 6;
  if (count === 13) first = 7;
  return [first, count - first];
}

function StackedColumn({ src, n }: { src: string; n: number }) {
  // Each image sits 20px above the previous one.
  const height = Math.max(0, (n - 1) * 20) + 70;
  return (
    <div className="relative w-20" style={{ height: `${height}px` }}>
      {Array.from({ length: n }, (_, i) => (
        <Image
          key={i}
          src={publicAsset(src)}
          alt=""
          width={80}
          height={80}
          className="absolute left-1/2 -translate-x-1/2 h-20 w-auto object-contain"
          style={{ bottom: `${i * 20}px`, zIndex: 10 + i }}
        />
      ))}
    </div>
  );
}

export function BatteryPartStack({ model, partLabel, count }: Props) {
  const src = imagePath(model, partLabel);
  if (!src || count === 0) return null;

  // BAT BOX stacks column-by-column; other parts render side by side.
  const isStacking = partLabel === "BAT BOX" && model !== "T30";
  const stacks = isStacking ? columns(count, model) : Array(count).fill(1);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-xs font-medium text-muted-foreground">
        {count}× {partLabel}
      </div>
      <div className="flex flex-wrap items-end justify-center gap-2">
        {stacks.map((n, i) => (
          <StackedColumn key={i} src={src} n={n} />
        ))}
      </div>
    </div>
  );
}

"use client";
import { Slider } from "@/components/ui/slider";
import type { BatterySeries } from "@/manufacturers/solax/battery-series";
import { snapKwh } from "@/lib/battery-montage";

interface Props {
  series: BatterySeries;
  value: number;
  onChange: (kwh: number) => void;
}

export function BatteryCapacitySlider({ series, value, onChange }: Props) {
  return (
    <div className="space-y-2">
      <div className="relative mt-6 mb-1">
        <div
          className="absolute -top-8 -translate-x-1/2 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums whitespace-nowrap"
          style={{ left: `${((value - series.minKwh) / (series.maxKwh - series.minKwh)) * 100}%` }}
        >
          {value.toFixed(1)} kWh
        </div>
        <Slider
          min={series.minKwh}
          max={series.maxKwh}
          step={series.moduleKwh}
          value={[value]}
          onValueChange={(v) => onChange(snapKwh(series, Array.isArray(v) ? v[0] : v))}
          aria-label="Batteriekapazität"
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground px-1">
        {series.sliderStops.map((stop) => (
          <span key={stop}>{stop}</span>
        ))}
      </div>
    </div>
  );
}

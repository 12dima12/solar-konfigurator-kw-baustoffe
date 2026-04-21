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
  const stops = series.sliderStops;
  if (stops.length === 0) return null;
  const min = stops[0];
  const max = stops[stops.length - 1];
  const span = max - min || 1;
  const pct = ((value - min) / span) * 100;

  return (
    <div className="space-y-2">
      <div className="relative mt-8 mb-1">
        <div
          className="absolute -top-8 -translate-x-1/2 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground tabular-nums whitespace-nowrap"
          style={{ left: `${pct}%` }}
        >
          {value.toFixed(1)} kWh
        </div>
        <Slider
          min={min}
          max={max}
          step={0.1}
          value={[value]}
          onValueChange={(v) => onChange(snapKwh(series, Array.isArray(v) ? v[0] : v))}
          aria-label="Batteriekapazität"
        />
      </div>
      <div className="relative h-5 text-xs text-muted-foreground">
        {stops.map((stop) => {
          const leftPct = ((stop - min) / span) * 100;
          return (
            <button
              key={stop}
              type="button"
              onClick={() => onChange(stop)}
              className="absolute -translate-x-1/2 hover:text-primary tabular-nums"
              style={{ left: `${leftPct}%` }}
            >
              {Number.isInteger(stop) ? stop : stop.toFixed(1)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

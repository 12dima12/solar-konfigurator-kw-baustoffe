"use client";
import { Slider } from "@/components/ui/slider";
import type { BatterySeries } from "@/manufacturers/solax/battery-series";
import { snapKwh } from "@/lib/battery-montage";
import { Minus, Plus } from "lucide-react";

interface Props {
  series: BatterySeries;
  value: number;
  onChange: (kwh: number) => void;
}

/**
 * Slider mit fixen Stops aus `series.sliderStops`, großer gelber Pill oberhalb
 * des Thumbs (zeigt aktuelle kWh) und zusätzlichen `−` / `+` Buttons an den
 * Rändern für User, die auf die kleinen Tick-Dots nicht präzise genug tippen
 * (Mobile). Klick auf `−`/`+` springt zum vorigen/nächsten Stop.
 */
export function BatteryCapacitySlider({ series, value, onChange }: Props) {
  const stops = series.sliderStops;
  if (stops.length === 0) return null;
  const min = stops[0];
  const max = stops[stops.length - 1];
  const span = max - min || 1;
  const pct = ((value - min) / span) * 100;

  // Scale labels every 5 kWh (0, 5, 10, …, up to max rounded up). This matches
  // GBC's ruler, where the labeled ticks live on a separate layer from the fine
  // per-stop ticks — solves the mobile overlap: 21 float labels (10, 12.5, 14.4,
  // 15, 17.5, 18, 20, 21.6, 22.5, 25, …) do not fit in ~340 px.
  const scaleMax = Math.ceil(max / 5) * 5;
  const scaleLabels: number[] = [];
  for (let v = Math.ceil(min / 5) * 5; v <= scaleMax; v += 5) {
    scaleLabels.push(v);
  }

  const currentIndex = stops.findIndex((s) => Math.abs(s - value) < 0.01);
  const canDecrement = currentIndex > 0;
  const canIncrement = currentIndex >= 0 && currentIndex < stops.length - 1;

  const stepDown = () => {
    if (currentIndex > 0) onChange(stops[currentIndex - 1]);
    else {
      // Value is between stops — snap to next lower stop
      const lower = [...stops].reverse().find((s) => s < value);
      if (lower !== undefined) onChange(lower);
    }
  };

  const stepUp = () => {
    if (currentIndex >= 0 && currentIndex < stops.length - 1) {
      onChange(stops[currentIndex + 1]);
    } else {
      const upper = stops.find((s) => s > value);
      if (upper !== undefined) onChange(upper);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* − Button (red) */}
        <button
          type="button"
          onClick={stepDown}
          disabled={!canDecrement && value <= min + 0.01}
          aria-label="Kapazität verringern"
          className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Minus className="h-6 w-6" strokeWidth={3} />
        </button>

        {/* Slider-Track mit Pill, Thumb, Dots */}
        <div className="relative flex-1 mt-8 mb-1">
          {/* Gelbe Pill mit aktueller kWh-Zahl — exakt überm Thumb */}
          <div
            className="absolute -top-8 -translate-x-1/2 rounded-md bg-yellow-400 px-3 py-1 text-sm font-bold text-neutral-900 tabular-nums whitespace-nowrap shadow-sm"
            style={{ left: `${Math.max(0, Math.min(100, pct))}%` }}
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
          {/* Fine per-stop ticks sit right on the track — clickable for quick
              jumps, but without labels so nothing overlaps on narrow screens. */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 pointer-events-none">
            {stops.map((stop) => {
              const leftPct = ((stop - min) / span) * 100;
              const active = Math.abs(stop - value) < 0.01;
              return (
                <button
                  key={stop}
                  type="button"
                  onClick={() => onChange(stop)}
                  aria-label={`${stop} kWh`}
                  title={`${stop} kWh`}
                  className={[
                    "absolute -translate-x-1/2 -translate-y-1/2 h-2 w-2 rounded-full pointer-events-auto transition-colors",
                    active ? "bg-primary ring-2 ring-primary/30" : "bg-muted-foreground/40 hover:bg-primary",
                  ].join(" ")}
                  style={{ left: `${leftPct}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* + Button (green) */}
        <button
          type="button"
          onClick={stepUp}
          disabled={!canIncrement && value >= max - 0.01}
          aria-label="Kapazität erhöhen"
          className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="h-6 w-6" strokeWidth={3} />
        </button>
      </div>

      {/* Numeric labels only at 5 kWh intervals — fixed grid that stays readable
          from 320 px upward. Indented to match the slider-track width (minus the
          +/- button columns). */}
      <div className="relative h-4 text-[10px] sm:text-xs text-muted-foreground mx-12 sm:mx-13">
        {scaleLabels.map((v) => {
          const leftPct = ((v - min) / span) * 100;
          if (leftPct < -1 || leftPct > 101) return null;
          return (
            <span
              key={v}
              className="absolute -translate-x-1/2 tabular-nums whitespace-nowrap"
              style={{ left: `${leftPct}%` }}
            >
              {v}
            </span>
          );
        })}
      </div>
    </div>
  );
}

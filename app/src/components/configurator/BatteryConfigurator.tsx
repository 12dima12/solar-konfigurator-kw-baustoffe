"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BatteryCapacitySlider } from "./BatteryCapacitySlider";
import { SOLAX_BATTERY_SERIES, type BatterySeries } from "@/manufacturers/solax/battery-series";
import { computeMontage } from "@/lib/battery-montage";
import type { Lang } from "@/data/types";
import { Battery, Check } from "lucide-react";

interface Props {
  lang: Lang;
  onConfirm: (payload: { key: string; label: string; value: string; kwh: number; model: string }) => void;
}

const UI = {
  de: {
    chooseCapacity: "Wählen Sie die Batteriekapazität:",
    chooseVariant: "Bitte wählen Sie die Batterie-Montagevariante:",
    montageLabel: "Montage",
    batterie: "Batterie",
    perModule: "je Modul",
    confirm: "Batterie übernehmen",
    back: "Zurück",
  },
  en: {
    chooseCapacity: "Select battery capacity:",
    chooseVariant: "Please select the battery mounting variant:",
    montageLabel: "Mounting",
    batterie: "Battery",
    perModule: "per module",
    confirm: "Confirm battery",
    back: "Back",
  },
  cs: {
    chooseCapacity: "Vyberte kapacitu baterie:",
    chooseVariant: "Vyberte variantu montáže baterie:",
    montageLabel: "Montáž",
    batterie: "Baterie",
    perModule: "na modul",
    confirm: "Potvrdit baterii",
    back: "Zpět",
  },
} satisfies Record<Lang, Record<string, string>>;

export function BatteryConfigurator({ lang, onConfirm }: Props) {
  const [series, setSeries] = useState<BatterySeries | null>(null);
  const [kwh, setKwh] = useState<number>(0);
  const t = UI[lang];

  if (!series) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SOLAX_BATTERY_SERIES.map((s) => (
          <button
            key={s.key}
            onClick={() => {
              setSeries(s);
              setKwh(s.defaultKwh);
            }}
            className="group rounded-xl border-2 border-border hover:border-primary p-5 text-left transition-all hover:shadow-md cursor-pointer bg-card flex flex-col gap-2"
          >
            <div className="font-semibold text-base leading-tight">{s.label}</div>
            <div className="text-xs text-muted-foreground">
              {s.moduleLabel}
            </div>
            {s.hint && (
              <div className="mt-auto text-xs font-medium text-primary">{s.hint}</div>
            )}
          </button>
        ))}
      </div>
    );
  }

  const montage = computeMontage(series, kwh);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold">{series.label}</h3>
        <p className="text-xs text-muted-foreground">{series.moduleLabel}</p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">{t.chooseCapacity}</p>
        <BatteryCapacitySlider series={series} value={kwh} onChange={setKwh} />
      </div>

      <div className="flex items-center gap-2 text-sm">
        <Battery className="h-5 w-5 text-primary" />
        <span className="font-semibold tabular-nums">{kwh.toFixed(2)} kWh</span>
        <span className="text-muted-foreground">{t.batterie}</span>
        <span className="rounded bg-muted px-2 py-0.5 text-xs font-mono">{montage.model}</span>
        <span className="text-muted-foreground">{t.montageLabel}</span>
      </div>

      {montage.parts.length > 0 && (
        <Card className="p-4 border-2 border-primary/20 bg-primary/5">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">{t.chooseVariant}</p>
          <p className="font-semibold text-sm mb-2">
            {t.montageLabel} 1 → {montage.model} · {montage.kwh.toFixed(2)} kWh
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            {montage.parts.map((p) => (
              <li key={p.label} className="flex items-center gap-1.5">
                <span className="font-semibold tabular-nums">{p.count}×</span>
                <span>{p.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex items-center justify-between pt-2 gap-2">
        <Button variant="ghost" onClick={() => setSeries(null)} className="text-muted-foreground">
          ← {t.back}
        </Button>
        <Button
          onClick={() =>
            onConfirm({
              key: series.key,
              label: `${series.label} – ${montage.kwh.toFixed(2)} kWh`,
              value: `${montage.kwh.toFixed(2)} kWh`,
              kwh: montage.kwh,
              model: montage.model,
            })
          }
          disabled={montage.parts.length === 0}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          {t.confirm}
        </Button>
      </div>
    </div>
  );
}

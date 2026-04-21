"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConfigStore } from "@/store/configStore";
import {
  SOLAX_DONGLES,
  SOLAX_OTHER_ACCESSORIES,
  SOLAX_SMART_METERS,
  BATTERY_HOLDING_BRACKET,
  BATTERY_BASE_PLATE,
} from "@/manufacturers/solax/accessory-catalog";
import { computeBatteryAccessories } from "@/lib/battery-accessory";
import type { Lang } from "@/data/types";
import { Check, Battery, Radio, Package, Gauge } from "lucide-react";

export interface AccessorySelection {
  summary: string;          // short breadcrumb text
  productListMulti: string; // newline-separated list for the sales email
}

interface Props {
  lang: Lang;
  onConfirm: (payload: AccessorySelection) => void;
  onBack: () => void;
}

const UI = {
  de: {
    title: "Zubehör auswählen",
    forBattery: "Zubehör für Batterie",
    autoDerived: "Wird automatisch aus der Modulanzahl berechnet",
    selectDongle: "Dongle auswählen",
    noDongle: "Kein Dongle",
    others: "Weitere (optional)",
    smartMeter: "Smart Meter",
    noMeter: "Kein Smart Meter",
    confirm: "Zubehör übernehmen",
    back: "Zurück",
    popular: "Beliebte Wahl",
    comingSoon: "Demnächst verfügbar",
    module: "Modul",
    modules: "Module",
  },
  en: {
    title: "Select accessories",
    forBattery: "Battery accessories",
    autoDerived: "Derived automatically from the module count",
    selectDongle: "Select dongle",
    noDongle: "No dongle",
    others: "Other (optional)",
    smartMeter: "Smart meter",
    noMeter: "No meter",
    confirm: "Confirm accessories",
    back: "Back",
    popular: "Popular choice",
    comingSoon: "Coming soon",
    module: "module",
    modules: "modules",
  },
  cs: {
    title: "Vyberte příslušenství",
    forBattery: "Příslušenství pro baterii",
    autoDerived: "Automaticky podle počtu modulů",
    selectDongle: "Vyberte dongle",
    noDongle: "Bez donglu",
    others: "Další (volitelné)",
    smartMeter: "Smart meter",
    noMeter: "Bez meteru",
    confirm: "Potvrdit příslušenství",
    back: "Zpět",
    popular: "Oblíbená volba",
    comingSoon: "Již brzy",
    module: "modul",
    modules: "moduly",
  },
} satisfies Record<Lang, Record<string, string>>;

export function AccessoryConfigurator({ lang, onConfirm, onBack }: Props) {
  const t = UI[lang];
  const selections = useConfigStore((s) => s.selections);

  const batteryMeta = selections.find((s) => s.phase === "battery")?.selectedProduct?.batteryMeta;
  const moduleCount = batteryMeta?.moduleCount ?? 0;
  const batteryAcc = computeBatteryAccessories(moduleCount);

  const inverterSteps = selections.find((s) => s.phase === "inverter")?.steps ?? [];
  const isX1 = inverterSteps.includes("Single-phase inverter X1");
  const isX3 = inverterSteps.includes("Three-phase inverter X3");
  const availableMeters = SOLAX_SMART_METERS.filter(
    (m) => (isX1 && m.phase === "X1") || (isX3 && m.phase === "X3"),
  );

  const [dongleKey, setDongleKey] = useState<string | null>("dongle-wifi-lan");
  const [otherKeys, setOtherKeys] = useState<Set<string>>(new Set());
  const [meterKey, setMeterKey] = useState<string | null>(availableMeters[0]?.key ?? null);

  const toggleOther = (k: string) =>
    setOtherKeys((prev) => {
      const next = new Set(prev);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });

  const submit = () => {
    const lines: string[] = [];
    const summaryBits: string[] = [];

    if (batteryAcc.brackets > 0) {
      lines.push(`${batteryAcc.brackets}× ${BATTERY_HOLDING_BRACKET.productName}`);
      summaryBits.push(`${batteryAcc.brackets}× Bracket`);
    }
    if (batteryAcc.basePlates > 0) {
      lines.push(`${batteryAcc.basePlates}× ${BATTERY_BASE_PLATE.productName}`);
      summaryBits.push(`${batteryAcc.basePlates}× Base Plate`);
    }

    if (dongleKey) {
      const d = SOLAX_DONGLES.find((x) => x.key === dongleKey);
      if (d) {
        lines.push(`1× ${d.productName}`);
        summaryBits.push(d.label);
      }
    }

    for (const k of otherKeys) {
      const o = SOLAX_OTHER_ACCESSORIES.find((x) => x.key === k);
      if (o && !o.comingSoon) {
        lines.push(`1× ${o.productName} (${o.code})`);
        summaryBits.push(o.label);
      }
    }

    if (meterKey) {
      const m = SOLAX_SMART_METERS.find((x) => x.key === meterKey);
      if (m) {
        lines.push(`1× ${m.productName}`);
        summaryBits.push(m.label.replace("Solax Chint ", ""));
      }
    }

    onConfirm({
      summary: summaryBits.length === 0 ? "Kein Zubehör" : `${summaryBits.length} Positionen`,
      productListMulti: lines.join(" · "),
    });
  };

  return (
    <div className="space-y-6">
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Battery className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.forBattery}</h3>
          <span className="text-xs text-muted-foreground">· {t.autoDerived}</span>
        </div>
        {moduleCount > 0 ? (
          <Card className="p-3 text-sm bg-muted/40 border-muted">
            <div className="text-xs text-muted-foreground mb-1">
              {batteryMeta?.seriesLabel} · {moduleCount} {moduleCount === 1 ? t.module : t.modules}
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-1">
              <li className="flex items-center gap-1.5">
                <span className="font-semibold tabular-nums">{batteryAcc.brackets}×</span>
                <span>{BATTERY_HOLDING_BRACKET.label}</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span className="font-semibold tabular-nums">{batteryAcc.basePlates}×</span>
                <span>{BATTERY_BASE_PLATE.label}</span>
              </li>
            </ul>
          </Card>
        ) : (
          <p className="text-xs text-muted-foreground italic">—</p>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Radio className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.selectDongle}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => setDongleKey(null)}
            className={[
              "rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors",
              dongleKey === null ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            ].join(" ")}
          >
            {t.noDongle}
          </button>
          {SOLAX_DONGLES.map((d) => (
            <button
              key={d.key}
              onClick={() => setDongleKey(d.key)}
              className={[
                "rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors",
                dongleKey === d.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              ].join(" ")}
            >
              <div className="font-semibold">{d.label}</div>
              <div className="text-xs text-muted-foreground truncate">{d.productName}</div>
              {d.hint && <div className="text-xs text-primary mt-0.5">{d.hint}</div>}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Package className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.others}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {SOLAX_OTHER_ACCESSORIES.map((o) => {
            const selected = otherKeys.has(o.key);
            return (
              <button
                key={o.key}
                onClick={() => !o.comingSoon && toggleOther(o.key)}
                disabled={o.comingSoon}
                className={[
                  "rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors",
                  o.comingSoon
                    ? "border-dashed border-border opacity-60 cursor-not-allowed"
                    : selected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{o.label}</span>
                  {selected && !o.comingSoon && <Check className="h-4 w-4 text-primary" />}
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate">{o.code}</div>
                {o.description && (
                  <div className="text-xs text-muted-foreground mt-0.5">{o.description}</div>
                )}
                {o.comingSoon && <div className="text-xs italic mt-0.5">{t.comingSoon}</div>}
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-3">
          <Gauge className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">{t.smartMeter}</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={() => setMeterKey(null)}
            className={[
              "rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors",
              meterKey === null ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
            ].join(" ")}
          >
            {t.noMeter}
          </button>
          {availableMeters.map((m) => (
            <button
              key={m.key}
              onClick={() => setMeterKey(m.key)}
              className={[
                "rounded-lg border-2 px-3 py-2 text-left text-sm transition-colors",
                meterKey === m.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
              ].join(" ")}
            >
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs text-muted-foreground">{m.phase}</div>
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between pt-2 gap-2">
        <Button variant="ghost" onClick={onBack} className="text-muted-foreground">
          ← {t.back}
        </Button>
        <Button onClick={submit} className="gap-2">
          <Check className="h-4 w-4" />
          {t.confirm}
        </Button>
      </div>
    </div>
  );
}

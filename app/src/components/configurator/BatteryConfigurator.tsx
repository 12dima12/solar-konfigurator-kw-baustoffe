"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { BatteryCapacitySlider } from "./BatteryCapacitySlider";
import { SOLAX_BATTERY_SERIES, type BatterySeries } from "@/manufacturers/solax/battery-series";
import { useConfigStore } from "@/store/configStore";
import { montagesForKwh, type BatteryMontage } from "@/lib/battery-montage";
import { countBatteryModules } from "@/lib/battery-accessory";
import type { Lang } from "@/data/types";
import { Battery, Check } from "lucide-react";
import Image from "next/image";
import { publicAsset } from "@/lib/public-asset";
import { BatteryPartStack } from "./BatteryPartStack";

interface Props {
  lang: Lang;
  onConfirm: (payload: {
    key: string;
    label: string;
    value: string;
    kwh: number;
    model: string;
    seriesLabel: string;
    moduleCount: number;
    montageParts: BatteryMontage["parts"];
  }) => void;
}

const UI = {
  de: {
    chooseCapacity: "Wählen Sie die Batteriekapazität:",
    chooseVariant: "Bitte wählen Sie die Batterie-Montagevariante:",
    chooseSeries: "Batterieserie wählen:",
    batterieMontage: "kWh Batterie Montage",
    montageLabel: "Montage",
    confirm: "Batterie übernehmen",
    back: "Zurück",
  },
  en: {
    chooseCapacity: "Select battery capacity:",
    chooseVariant: "Please select the battery mounting variant:",
    chooseSeries: "Choose battery series:",
    batterieMontage: "kWh battery montage",
    montageLabel: "Mounting",
    confirm: "Confirm battery",
    back: "Back",
  },
  cs: {
    chooseCapacity: "Vyberte kapacitu baterie:",
    chooseVariant: "Vyberte variantu montáže baterie:",
    chooseSeries: "Vyberte sérii baterie:",
    batterieMontage: "kWh montáž baterie",
    montageLabel: "Montáž",
    confirm: "Potvrdit baterii",
    back: "Zpět",
  },
} satisfies Record<Lang, Record<string, string>>;

export function BatteryConfigurator({ lang, onConfirm }: Props) {
  const t = UI[lang];

  // IES inverters require the HS50E-D battery series; Split-System uses the
  // three Triple Power series. Scope is derived from the inverter steps the
  // user committed so the series grid only shows electrically valid choices.
  const inverterSteps = useConfigStore(
    (s) => s.selections.find((sel) => sel.phase === "inverter")?.steps ?? [],
  );
  const isIES = inverterSteps.includes("IES");
  const availableSeries = SOLAX_BATTERY_SERIES.filter((s) =>
    isIES ? s.scope === "ies" : s.scope === "split",
  );

  // Default: erste verfügbare Serie, sodass der User sofort den Slider sieht
  // und via Thumbnails unten zwischen Serien wechseln kann.
  const [series, setSeries] = useState<BatterySeries | null>(
    availableSeries[0] ?? null,
  );
  const [kwh, setKwh] = useState<number>(series?.sliderStops[0] ?? 0);
  const [variantIdx, setVariantIdx] = useState<number>(0);

  // Wenn sich die verfügbaren Serien ändern (z. B. bei einem Back-Button-Flow,
  // der den Inverter von Split auf IES wechselt), auf die jetzt gültige
  // Default-Serie zurückfallen, damit die Auswahl konsistent bleibt.
  // Dep-List nutzt `isIES` + `series?.key` als Primitive, sonst würde der
  // Effect bei jedem Render feuern (availableSeries ist ein neues Array).
  useEffect(() => {
    const nextAvailable = SOLAX_BATTERY_SERIES.filter((s) =>
      isIES ? s.scope === "ies" : s.scope === "split",
    );
    if (!series && nextAvailable[0]) {
      setSeries(nextAvailable[0]);
      setKwh(nextAvailable[0].sliderStops[0] ?? 0);
      setVariantIdx(0);
    } else if (series && !nextAvailable.some((s) => s.key === series.key)) {
      const next = nextAvailable[0] ?? null;
      setSeries(next);
      setKwh(next?.sliderStops[0] ?? 0);
      setVariantIdx(0);
    }
  }, [isIES, series]);

  if (!series) {
    return (
      <div className="text-sm text-muted-foreground py-8 text-center">
        Keine kompatible Batterieserie verfügbar.
      </div>
    );
  }

  const variants = montagesForKwh(series, kwh);
  const selected = variants[Math.min(variantIdx, Math.max(0, variants.length - 1))];
  const displayKwh = selected?.kwh ?? kwh;
  const inverterName = inverterSteps[inverterSteps.length - 1] ?? "";

  return (
    <div className="space-y-6">
      {/* Kopf: Serie + Wechselrichter-Kontext */}
      <div>
        <h3 className="text-xl font-bold text-primary">{series.label}</h3>
        {inverterName && (
          <p className="text-sm text-muted-foreground mt-0.5">
            Wechselrichter: {inverterName}
          </p>
        )}
      </div>

      {/* Kapazitäts-Slider mit Pill + −/+ Buttons */}
      <div>
        <p className="text-sm font-medium mb-4">{t.chooseCapacity}</p>
        <BatteryCapacitySlider
          series={series}
          value={kwh}
          onChange={(v) => {
            setKwh(v);
            setVariantIdx(0);
          }}
        />
      </div>

      {/* Dynamische kWh-Anzeige – aktualisiert sich mit jeder Slider-Änderung */}
      <div className="flex items-center gap-3">
        <Battery className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tabular-nums">
          {displayKwh.toFixed(2)} {t.batterieMontage}
        </span>
      </div>

      {/* Hinweisbalken zur Montage-Wahl */}
      {variants.length > 0 && (
        <div className="rounded-md bg-neutral-800 text-white px-4 py-3 flex items-start gap-3">
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 text-[11px] font-bold">?</span>
          <p className="text-sm font-medium">{t.chooseVariant}</p>
        </div>
      )}

      {/* Montage-Varianten */}
      {variants.length > 0 && (
        <div className="space-y-2">
          {variants.map((v, i) => {
            const active = i === Math.min(variantIdx, variants.length - 1);
            return (
              <button
                key={i}
                type="button"
                onClick={() => setVariantIdx(i)}
                className={[
                  "w-full text-left rounded-lg border-2 p-4 transition-colors",
                  active ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                ].join(" ")}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <p className="font-semibold text-sm">
                    {t.montageLabel} {i + 1} → {v.model} · {v.kwh.toFixed(2)} kWh
                  </p>
                  <span
                    className={[
                      "h-5 w-5 rounded-full border-2 shrink-0",
                      active ? "border-primary bg-primary" : "border-muted-foreground/40",
                    ].join(" ")}
                    aria-hidden
                  />
                </div>
                <div className="flex flex-wrap items-end gap-6">
                  {v.parts.map((p) => (
                    <BatteryPartStack
                      key={p.label}
                      model={v.model}
                      partLabel={p.label}
                      count={p.count}
                    />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Aktionen */}
      <div className="flex items-center justify-between pt-2 gap-2">
        <Button variant="secondary" onClick={() => setSeries(null)} className="bg-neutral-800 text-white hover:bg-neutral-700">
          {t.back}
        </Button>
        <Button
          onClick={() => {
            if (!selected) return;
            onConfirm({
              key: series.key,
              label: `${series.label} – ${selected.kwh.toFixed(2)} kWh (${t.montageLabel} ${Math.min(variantIdx, variants.length - 1) + 1})`,
              value: `${selected.kwh.toFixed(2)} kWh`,
              kwh: selected.kwh,
              model: selected.model,
              seriesLabel: series.label,
              moduleCount: countBatteryModules(selected.parts),
              montageParts: selected.parts,
            });
          }}
          disabled={!selected}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          {t.confirm}
        </Button>
      </div>

      {/* Serien-Thumbnails unten — bildliche Auswahl der verfügbaren
          Batterien. Klick wechselt die Serie, Slider springt auf den
          kleinsten Stop der neuen Serie. Der aktive Eintrag ist optisch
          hervorgehoben (primäre Border + primäre Unterlegung). */}
      {availableSeries.length > 1 && (
        <div className="pt-4 border-t border-border">
          <p className="text-xs font-semibold uppercase text-muted-foreground mb-3">
            {t.chooseSeries}
          </p>
          <div className="flex flex-wrap gap-3">
            {availableSeries.map((s) => {
              const active = s.key === series.key;
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => {
                    if (s.key === series.key) return;
                    setSeries(s);
                    setKwh(s.sliderStops[0] ?? 0);
                    setVariantIdx(0);
                  }}
                  aria-pressed={active}
                  title={s.label}
                  className={[
                    "shrink-0 rounded-lg border-2 p-2 transition-all bg-card",
                    active
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/60",
                  ].join(" ")}
                >
                  <Image
                    src={publicAsset(s.image)}
                    alt={s.label}
                    width={90}
                    height={90}
                    className="h-16 w-16 sm:h-20 sm:w-20 object-contain"
                  />
                  <span
                    className={[
                      "block text-[10px] sm:text-xs font-medium text-center mt-1 max-w-[80px] sm:max-w-[96px] truncate",
                      active ? "text-primary" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

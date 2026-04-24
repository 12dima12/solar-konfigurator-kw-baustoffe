"use client";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { OptionGrid } from "./OptionGrid";
import { getChildrenSorted, resolveNode } from "@/lib/navigation";
import type { ConfigNode, Lang } from "@/data/types";
import { POWER_STOPS_X3, POWER_OVER_30_KEY } from "@/lib/constants";
import { Minus, Phone, Plus } from "lucide-react";

interface Props {
  lang: Lang;
  steps: string[];
  onSelect: (key: string, node: ConfigNode) => void;
  catalog: Record<string, unknown>;
}

export function PowerSlider({ lang, steps, onSelect, catalog }: Props) {
  const [sliderIndex, setSliderIndex] = useState(0);
  const selectedKw = POWER_STOPS_X3[sliderIndex];

  const powerKey =
    sliderIndex >= POWER_STOPS_X3.length
      ? POWER_OVER_30_KEY
      : `${selectedKw}.0 kW`;

  const parentNode = resolveNode("inverter", lang, steps, catalog);
  if (!parentNode) return null;

  const isOver30 = sliderIndex === POWER_STOPS_X3.length;

  const powerNode = parentNode.children
    ? (parentNode.children as Record<string, ConfigNode>)[powerKey]
    : undefined;

  const powerChildren = powerNode ? getChildrenSorted(powerNode) : [];

  const labels: Record<string, { title: string; unit: string; contact: string; request: string; ariaPower: string; noProducts: string; decrease: string; increase: string }> = {
    de: {
      title: "Benötigte Leistung auswählen",
      unit: "kW",
      contact: "Bitte kontaktieren Sie unseren Vertrieb für Leistungen über 30 kW.",
      request: "Anfrage senden",
      ariaPower: "Leistung",
      noProducts: `Für ${selectedKw} kW keine Produkte verfügbar.`,
      decrease: "Leistung verringern",
      increase: "Leistung erhöhen",
    },
    en: {
      title: "Select required power",
      unit: "kW",
      contact: "Please contact our sales team for power above 30 kW.",
      request: "Send request",
      ariaPower: "Power",
      noProducts: `No products available for ${selectedKw} kW.`,
      decrease: "Decrease power",
      increase: "Increase power",
    },
    cs: {
      title: "Vyberte požadovaný výkon",
      unit: "kW",
      contact: "Pro výkony nad 30 kW prosím kontaktujte náš prodejní tým.",
      request: "Odeslat poptávku",
      ariaPower: "Výkon",
      noProducts: `Pro ${selectedKw} kW nejsou dostupné žádné produkty.`,
      decrease: "Snížit výkon",
      increase: "Zvýšit výkon",
    },
  };
  const l = labels[lang] ?? labels.de;

  const maxIdx = POWER_STOPS_X3.length; // inclusive: last index = ">30 kW"
  const canDec = sliderIndex > 0;
  const canInc = sliderIndex < maxIdx;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{l.title}</h3>

        <div className="flex items-center gap-4 mb-2">
          <span className="text-3xl font-bold text-primary tabular-nums w-20">
            {isOver30 ? "> 30" : selectedKw} <span className="text-base font-normal">{l.unit}</span>
          </span>
        </div>

        {/* −/+ Buttons flankieren den Slider. Wenn das Antippen der Tick-Dots
            auf Mobile wacklig ist, kommt man so trotzdem schrittweise an den
            gewünschten Stop. */}
        <div className="flex items-center gap-3 sm:gap-4 my-4">
          <button
            type="button"
            onClick={() => canDec && setSliderIndex((i) => Math.max(0, i - 1))}
            disabled={!canDec}
            aria-label={l.decrease}
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="h-6 w-6" strokeWidth={3} />
          </button>

          <Slider
            min={0}
            max={maxIdx}
            step={1}
            value={[sliderIndex]}
            onValueChange={(vals) => setSliderIndex(Array.isArray(vals) ? vals[0] : vals)}
            className="flex-1"
            aria-label={l.ariaPower}
          />

          <button
            type="button"
            onClick={() => canInc && setSliderIndex((i) => Math.min(maxIdx, i + 1))}
            disabled={!canInc}
            aria-label={l.increase}
            className="shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full text-emerald-600 hover:bg-emerald-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-6 w-6" strokeWidth={3} />
          </button>
        </div>

        {/* kW-Ruler unterhalb des Sliders, in der Track-Breite (minus −/+ Buttons). */}
        <div className="flex justify-between text-xs text-muted-foreground px-1 mx-12 sm:mx-13">
          {POWER_STOPS_X3.map((kw) => (
            <span key={kw}>{kw}</span>
          ))}
          <span>&gt;30</span>
        </div>
      </div>

      {isOver30 ? (
        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-center space-y-3">
          <Phone className="mx-auto h-8 w-8 text-primary" />
          <p className="text-sm font-medium text-primary">{l.contact}</p>
          <Button variant="outline" className="border-primary text-primary hover:bg-primary hover:text-white">
            {l.request}
          </Button>
        </div>
      ) : powerChildren.length > 0 ? (
        <>
          {/* The power-stage nodes in catalog.json carry a question title
              like "Benötigte Anzahl an MPP-Trackern?" (8–20 kW) or
              "Mit AFCI?" (25/30 kW). Surface it above the options grid so
              the user knows what they're picking between. */}
          {powerNode?.title && (
            <h4 className="text-sm font-semibold mb-3">{powerNode.title}</h4>
          )}
          <OptionGrid lang={lang} children={powerChildren} onSelect={onSelect} />
        </>
      ) : (
        <div className="text-center text-muted-foreground text-sm py-8">
          {l.noProducts}
        </div>
      )}
    </div>
  );
}

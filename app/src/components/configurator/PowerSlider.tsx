"use client";
import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { OptionGrid } from "./OptionGrid";
import { getChildrenSorted, resolveNode } from "@/lib/navigation";
import type { ConfigNode, Lang } from "@/data/types";
import { POWER_STOPS_X3, POWER_OVER_30_KEY } from "@/lib/constants";
import { Phone } from "lucide-react";

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

  const sorted = getChildrenSorted(parentNode);
  const isOver30 = sliderIndex === POWER_STOPS_X3.length;

  const powerNode = parentNode.children
    ? (parentNode.children as Record<string, ConfigNode>)[powerKey]
    : undefined;

  const powerChildren = powerNode ? getChildrenSorted(powerNode) : [];

  const labels: Record<string, { title: string; unit: string; contact: string }> = {
    de: { title: "Benötigte Leistung auswählen", unit: "kW", contact: "Bitte kontaktieren Sie unseren Vertrieb für Leistungen über 30 kW." },
    en: { title: "Select required power", unit: "kW", contact: "Please contact our sales team for power above 30 kW." },
    cs: { title: "Vyberte požadovaný výkon", unit: "kW", contact: "Pro výkony nad 30 kW prosím kontaktujte náš prodejní tým." },
  };
  const l = labels[lang] ?? labels.de;

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-4">{l.title}</h3>

        <div className="flex items-center gap-4 mb-2">
          <span className="text-3xl font-bold text-primary tabular-nums w-20">
            {isOver30 ? "> 30" : selectedKw} <span className="text-base font-normal">{l.unit}</span>
          </span>
        </div>

        <Slider
          min={0}
          max={POWER_STOPS_X3.length}
          step={1}
          value={[sliderIndex]}
          onValueChange={(vals) => setSliderIndex(Array.isArray(vals) ? vals[0] : vals)}
          className="my-4"
          aria-label="Leistung"
        />

        <div className="flex justify-between text-xs text-muted-foreground px-1">
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
            Anfrage senden
          </Button>
        </div>
      ) : powerChildren.length > 0 ? (
        <OptionGrid children={powerChildren} onSelect={onSelect} />
      ) : (
        <div className="text-center text-muted-foreground text-sm py-8">
          Für {selectedKw} kW keine Produkte verfügbar.
        </div>
      )}
    </div>
  );
}

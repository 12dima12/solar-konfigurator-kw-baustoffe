"use client";
import { OptionCard } from "./OptionCard";
import type { ConfigNode, Lang } from "@/data/types";

interface Props {
  lang: Lang;
  children: Array<[string, ConfigNode]>;
  onSelect: (key: string, node: ConfigNode) => void;
}

const UI: Record<Lang, { empty: string }> = {
  de: { empty: "Keine Optionen verfügbar." },
  en: { empty: "No options available." },
  cs: { empty: "Žádné možnosti nejsou k dispozici." },
};

export function OptionGrid({ lang, children, onSelect }: Props) {
  const t = UI[lang] ?? UI.de;

  if (children.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        {t.empty}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {children.map(([key, node]) => (
        <OptionCard
          key={key}
          nodeKey={key}
          node={node}
          onClick={onSelect}
        />
      ))}
    </div>
  );
}

"use client";
import { OptionCard } from "./OptionCard";
import type { ConfigNode } from "@/data/types";

interface Props {
  children: Array<[string, ConfigNode]>;
  onSelect: (key: string, node: ConfigNode) => void;
}

export function OptionGrid({ children, onSelect }: Props) {
  if (children.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-12">
        Keine Optionen verfügbar.
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

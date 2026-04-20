"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { StockBadge } from "./StockBadge";
import { InfoModal } from "./InfoModal";
import type { ConfigNode } from "@/data/types";
import { isLeafNode } from "@/lib/navigation";

interface Props {
  nodeKey: string;
  node: ConfigNode;
  locale: string;
  onClick: (key: string, node: ConfigNode) => void;
  disabled?: boolean;
}

export function OptionCard({ nodeKey, node, locale, onClick, disabled }: Props) {
  const isLeaf = isLeafNode(node);
  const hasImage = !!node.image;
  const hasCover = !!node.cover;
  const label = node.label ?? node.value ?? nodeKey;
  const showInfo = !!node.info;

  return (
    <button
      onClick={() => !disabled && onClick(nodeKey, node)}
      disabled={disabled}
      className={cn(
        "relative group w-full text-left rounded-xl border-2 transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        disabled
          ? "opacity-50 cursor-not-allowed border-border bg-muted"
          : "border-border hover:border-primary hover:shadow-md cursor-pointer bg-card",
        hasCover && "overflow-hidden min-h-[160px]"
      )}
      aria-label={label}
    >
      {hasCover && (
        <div className="absolute inset-0">
          <Image
            src={`/products/media/${node.cover!.replace("img/media/", "")}`}
            alt={label}
            fill
            className="object-cover opacity-30 group-hover:opacity-40 transition-opacity"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/80 to-primary/20" />
        </div>
      )}

      <div className={cn("relative p-4", hasCover && "flex flex-col justify-end min-h-[160px]")}>
        {hasImage && !hasCover && (
          <div className="mb-3 flex justify-center">
            <Image
              src={`/products/${node.image!.replace("img/", "")}`}
              alt={label}
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        )}

        <div className={cn("font-semibold text-sm leading-tight", hasCover && "text-white")}>
          {label}
        </div>

        {node.description && !hasCover && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{node.description}</p>
        )}

        {node.product_name && (
          <p className="mt-1 text-xs text-muted-foreground font-mono truncate">{node.product_name}</p>
        )}

        {isLeaf && node.stock && (
          <div className="mt-2">
            <StockBadge stock={node.stock} locale={locale} />
          </div>
        )}
      </div>

      {showInfo && node.info && (
        <InfoModal title={label} html={node.info} />
      )}
    </button>
  );
}

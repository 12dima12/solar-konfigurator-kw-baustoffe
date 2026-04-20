import { Badge } from "@/components/ui/badge";
import { getStockStatus, getStockLabel, type StockInfo } from "@/lib/stock";
import { cn } from "@/lib/utils";

interface Props {
  stock: StockInfo | null | undefined;
  locale: string;
  className?: string;
}

export function StockBadge({ stock, locale, className }: Props) {
  if (!stock) return null;
  const status = getStockStatus(stock);
  const label = getStockLabel(stock, locale);

  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        status === "available" && "border-emerald-500 text-emerald-700 bg-emerald-50",
        status === "low" && "border-amber-500 text-amber-700 bg-amber-50",
        status === "on-order" && "border-amber-400 text-amber-600 bg-amber-50",
        status === "unavailable" && "border-red-400 text-red-600 bg-red-50",
        className
      )}
    >
      {label}
    </Badge>
  );
}

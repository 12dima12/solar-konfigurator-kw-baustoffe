export interface StockInfo {
  totalAvailable: number;
  totalOrdered: number;
}

export type StockStatus = "available" | "low" | "on-order" | "unavailable";

export function getStockStatus(stock: StockInfo | null | undefined): StockStatus {
  if (!stock) return "available";
  const { totalAvailable, totalOrdered } = stock;
  if (totalAvailable === 0 && totalOrdered === 0) return "unavailable";
  if (totalAvailable === 0 && totalOrdered > 0) return "on-order";
  if (totalAvailable < 10) return "low";
  return "available";
}

export function getStockLabel(stock: StockInfo | null | undefined, locale: string): string {
  if (!stock) return "";
  const { totalAvailable, totalOrdered } = stock;

  const labels: Record<string, Record<StockStatus, string>> = {
    de: {
      available: totalAvailable > 1000 ? "> 1000 Stück" : `${totalAvailable} verfügbar`,
      low: `Nur noch ${totalAvailable} verfügbar`,
      "on-order": `Unterwegs: ${totalOrdered} Stück`,
      unavailable: "Nicht verfügbar",
    },
    en: {
      available: totalAvailable > 1000 ? "> 1000 pcs" : `${totalAvailable} available`,
      low: `Only ${totalAvailable} left`,
      "on-order": `On order: ${totalOrdered} pcs`,
      unavailable: "Unavailable",
    },
    cs: {
      available: totalAvailable > 1000 ? "> 1000 ks" : `${totalAvailable} dostupné`,
      low: `Zbývá jen ${totalAvailable}`,
      "on-order": `Na cestě: ${totalOrdered} ks`,
      unavailable: "Nedostupné",
    },
  };

  const status = getStockStatus(stock);
  return (labels[locale] ?? labels.de)[status];
}

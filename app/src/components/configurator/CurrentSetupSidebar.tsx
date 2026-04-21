"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import type { PhaseSelection } from "@/store/configStore";
import { PHASE_LABELS } from "@/lib/constants";
import type { Lang } from "@/data/types";
import { publicAsset } from "@/lib/public-asset";

interface Props {
  selections: PhaseSelection[];
  lang: Lang;
}

const UI: Record<Lang, { title: string; empty: string; trigger: string }> = {
  de: { title: "Aktuelle Auswahl", empty: "Noch nichts ausgewählt.", trigger: "Meine Auswahl" },
  en: { title: "Current Selection", empty: "Nothing selected yet.", trigger: "My selection" },
  cs: { title: "Aktuální výběr", empty: "Zatím nic nevybráno.", trigger: "Můj výběr" },
};

export function CurrentSetupSidebar({ selections, lang }: Props) {
  const filled = selections.filter((s) => s.selectedProduct);
  const t = UI[lang] ?? UI.de;

  return (
    <Sheet>
      <SheetTrigger>
        <Button variant="outline" size="sm" className="relative">
          <ShoppingCart className="h-4 w-4 mr-2" />
          {t.trigger}
          {filled.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {filled.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {filled.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            filled.map((s) => (
              <div key={s.phase} className="flex items-start gap-3 border-b pb-3">
                {s.selectedProduct?.image && (
                  <Image
                    src={publicAsset(`/products/${s.selectedProduct.image.replace("img/", "")}`)}
                    alt={s.selectedProduct.value}
                    width={48}
                    height={48}
                    className="object-contain rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {(PHASE_LABELS as Record<string, Record<string, string>>)[s.phase]?.[lang] ?? s.phase}
                  </p>
                  <p className="text-sm font-semibold truncate">{s.selectedProduct?.value}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import Image from "next/image";
import type { PhaseSelection } from "@/store/configStore";
import { PHASE_LABELS } from "@/lib/constants";
import type { Lang } from "@/data/types";
import { publicAsset } from "@/lib/public-asset";
import { scrollToTop } from "@/lib/scroll-to-top";

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
      <SheetTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="relative"
            onClick={() => {
              // Beim Öffnen die Parent-Seite an den iframe-Anfang scrollen.
              // Ohne das tauchen Desktop-User, die schon weiter unten sind,
              // gedanklich unten im iframe das Sheet auf (es scrollt zum
              // Sheet-Positionsanker, nicht zum Viewport-Top des Browsers).
              // Via postMessage bekommt der Parent das Signal, den iframe
              // selbst in den Viewport zu ziehen — das Sheet liegt dann
              // oben und muss nicht gescrollt werden.
              scrollToTop();
            }}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {t.trigger}
            {filled.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                {filled.length}
              </span>
            )}
          </Button>
        }
      />
      {/* w-full auf Mobile, max-w-sm ab sm-Breakpoint (Desktop-Sheet bleibt kompakt). */}
      <SheetContent className="w-full sm:max-w-sm p-0 overflow-y-auto">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle>{t.title}</SheetTitle>
        </SheetHeader>
        <div className="px-5 py-4 space-y-3">
          {filled.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          ) : (
            filled.map((s) => (
              <div
                key={s.phase}
                className="flex items-start gap-3 border-b border-border/60 pb-3 last:border-b-0 last:pb-0"
              >
                {s.selectedProduct?.image ? (
                  <div className="shrink-0 h-12 w-12 flex items-center justify-center rounded-md bg-muted/40">
                    <Image
                      src={publicAsset(`/products/${s.selectedProduct.image.replace("img/", "")}`)}
                      alt={s.selectedProduct.value}
                      width={40}
                      height={40}
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                ) : (
                  <div className="shrink-0 h-12 w-12 rounded-md bg-muted/30" aria-hidden />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {(PHASE_LABELS as Record<string, Record<string, string>>)[s.phase]?.[lang] ?? s.phase}
                  </p>
                  {/* Für die Inverter-Phase ist `value` oft nur "5.0 kW";
                      der Leistung-Zusatz bringt Parität zur GBC-Sidebar. */}
                  {s.phase === "inverter" && s.selectedProduct?.value && (
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                      {lang === "de" ? "Leistung (kW)" : lang === "en" ? "Power (kW)" : "Výkon (kW)"}
                    </p>
                  )}
                  <p className="text-sm font-semibold break-words">{s.selectedProduct?.value}</p>
                  {s.selectedProduct?.product_name && s.phase === "inverter" && (
                    <p className="text-xs text-muted-foreground break-words">{s.selectedProduct.product_name}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

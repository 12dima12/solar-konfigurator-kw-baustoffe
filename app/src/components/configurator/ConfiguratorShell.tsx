"use client";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { StepIndicator } from "./StepIndicator";
import { OptionGrid } from "./OptionGrid";
import { PowerSlider } from "./PowerSlider";
import { BatteryConfigurator } from "./BatteryConfigurator";
import { AccessoryConfigurator, type AccessorySelection } from "./AccessoryConfigurator";
import { InstallationTypePicker } from "./InstallationTypePicker";
import { SubmitSummary } from "./SubmitSummary";
import { CurrentSetupSidebar } from "./CurrentSetupSidebar";
import { useConfigState } from "@/hooks/useConfigState";
import { useConfigStore } from "@/store/configStore";
import { useIframeResize } from "@/hooks/useIframeResize";
import { ACTIVE_PHASES } from "@/lib/navigation";
import { scrollToTop } from "@/lib/scroll-to-top";
import { useManufacturer } from "@/lib/manufacturer-context";
import { ChevronLeft, RotateCcw } from "lucide-react";
import { publicAsset } from "@/lib/public-asset";
import type { Lang } from "@/data/types";

const PHASE_TITLES: Record<string, Record<Lang, string>> = {
  inverter: { de: "Montagetyp wählen", en: "Choose installation type", cs: "Vyberte typ montáže" },
  backup: { de: "Notstromversorgung", en: "Backup power", cs: "Záložní napájení" },
  battery: { de: "Batterie auswählen", en: "Select battery", cs: "Vyberte baterii" },
  wallbox: { de: "Wallbox konfigurieren", en: "Configure wallbox", cs: "Konfigurace wallboxu" },
  accessory: { de: "Zubehör auswählen", en: "Select accessories", cs: "Vyberte příslušenství" },
};

const BACK_LABELS: Record<Lang, string> = {
  de: "Zurück",
  en: "Back",
  cs: "Zpět",
};

export function ConfiguratorShell() {
  useIframeResize();
  const manufacturer = useManufacturer();
  const installationType = useConfigStore((s) => s.installationType);
  const setInstallationType = useConfigStore((s) => s.setInstallationType);
  const clearInstallationType = useConfigStore((s) => s.clearInstallationType);

  const { phase, lang, steps, currentNode, children: rawChildren, isFinalPhase, currentPhaseIndex, selections, handleSelect, goBack, goToPhase, reset } =
    useConfigState(manufacturer.catalog);

  // Apply manufacturer rules — e.g. for SolaX hide X1 backup units when an
  // X3 inverter was picked (and vice versa) so only electrically compatible
  // options show up in the grid.
  const children = manufacturer.rules.filterOptions(phase, lang, rawChildren, selections, installationType);

  const isX3 =
    phase === "inverter" &&
    steps.includes("Split System") &&
    steps.includes("Three-phase inverter X3");

  const isBattery = phase === "battery";
  const isAccessory = phase === "accessory";

  const isFinalStep = isFinalPhase && !!selections[currentPhaseIndex]?.selectedProduct;

  const completedPhases = selections
    .map((s, i) => (s.selectedProduct ? i : -1))
    .filter((i) => i >= 0);

  const totalDepth = isBattery ? 1 : (children.length === 0 ? 1 : 4);
  const progress = Math.round(((currentPhaseIndex + steps.length / Math.max(totalDepth, 1)) / ACTIVE_PHASES.length) * 100);

  const phaseTitle = PHASE_TITLES[phase]?.[lang] ?? phase;

  // Battery phase uses a dedicated configurator (series card → capacity slider
  // → live montage preview) instead of the generic option grid. The selected
  // configuration is committed via the same store.confirmProduct path as every
  // other phase.
  const confirmBattery = (payload: {
    key: string;
    label: string;
    value: string;
    kwh: number;
    model: string;
    seriesLabel: string;
    moduleCount: number;
    montageParts: Array<{ count: number; label: string }>;
  }) => {
    const store = useConfigStore.getState();
    store.confirmProduct({
      product_name: `${payload.label} · ${payload.model}`,
      value: payload.value,
      image: null,
      batteryMeta: {
        seriesKey: payload.key,
        seriesLabel: payload.seriesLabel,
        kwh: payload.kwh,
        moduleCount: payload.moduleCount,
        model: payload.model,
        parts: payload.montageParts,
      },
    });
    if (!isFinalPhase) store.skipPhase();
    scrollToTop();
  };

  // Accessory phase is fully custom: the summary/product list is synthesised
  // from Battery meta + dongle + others + smart meter. Everything lands in
  // selectedProduct.product_name so the sales email renders it as one row.
  const confirmAccessory = (payload: AccessorySelection) => {
    const store = useConfigStore.getState();
    store.confirmProduct({
      product_name: payload.productListMulti || "Kein Zubehör",
      value: payload.summary,
      image: null,
      items: payload.items,
    });
    if (!isFinalPhase) store.skipPhase();
    scrollToTop();
  };

  if (isFinalStep) {
    return (
      <div className="min-h-screen bg-background">
        <Header lang={lang} selections={selections} onReset={reset} logoUrl={manufacturer.meta.logoUrl} />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <SubmitSummary />
        </main>
      </div>
    );
  }

  // Prologue screen — installation type picker (Neuinstallation / AC-Kopplung).
  // Mirrors the GBC reference: the wizard proper only starts after the user
  // has committed to one of those two modes.
  if (!installationType) {
    return (
      <div className="min-h-screen bg-background">
        <Header lang={lang} selections={selections} onReset={reset} logoUrl={manufacturer.meta.logoUrl} />
        <main className="max-w-3xl mx-auto px-4 py-8">
          <InstallationTypePicker
            lang={lang}
            onPick={(t) => {
              setInstallationType(t);
              scrollToTop();
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header lang={lang} selections={selections} onReset={reset} logoUrl={manufacturer.meta.logoUrl} />

      <main className="max-w-3xl mx-auto px-4 pb-12">
        <StepIndicator
          currentPhaseIndex={currentPhaseIndex}
          lang={lang}
          onStepClick={goToPhase}
          completedPhases={completedPhases}
        />

        <Progress value={progress} className="mb-6 h-1.5" />

        {installationType === "ac-coupling" && (
          <div className="mb-6 rounded-lg border-2 border-amber-300 bg-amber-50 p-4 text-sm">
            <p className="font-semibold text-amber-900 mb-1">
              {lang === "de" ? "Wichtiger Hinweis — AC-Kopplung" : lang === "en" ? "Important note — AC Coupling" : "Důležité upozornění — AC Coupling"}
            </p>
            <p className="text-amber-800">
              {lang === "de"
                ? "Sie ergänzen eine bestehende PV-Anlage um einen Batteriespeicher. Die Produktauswahl ist auf Retrofit-kompatible Komponenten eingeschränkt. Bei Fragen zur Kompatibilität kontaktieren Sie bitte unseren Vertrieb."
                : lang === "en"
                ? "You are retrofitting an existing PV system with battery storage. The product selection is limited to retrofit-compatible components. For compatibility questions please contact our sales team."
                : "Doplňujete stávající fotovoltaický systém o baterii. Výběr produktů je omezen na komponenty kompatibilní s dovybavením. V případě dotazů kontaktujte prodejní tým."}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-primary">{phaseTitle}</h2>
            {steps.length > 0 && (
              <p className="text-sm text-muted-foreground mt-0.5">
                {steps.map((s) => <span key={s} className="after:content-['_›_'] last:after:content-[''] after:mx-1">{s}</span>)}
              </p>
            )}
            {/* Node-level question title (e.g. "Benötigte Anzahl an MPP-Trackern?"
                at the 8-kW branch, or "Mit AFCI?" at the 25-/30-kW branches).
                Taken straight from catalog.json's `title` field on the node we
                just descended into, so every intermediate step gets its proper
                question instead of a silent grid. */}
            {currentNode?.title && (
              <p className="text-sm font-medium mt-2">{currentNode.title}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Walking back past the first step / first phase reopens the
              // installation-type picker so the user can switch between
              // "Neuinstallation" and "AC-Kopplung".
              if (currentPhaseIndex === 0 && steps.length === 0) {
                clearInstallationType();
                scrollToTop();
              } else {
                goBack();
              }
            }}
            className="text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            {BACK_LABELS[lang]}
          </Button>
        </div>

        {isX3 ? (
          <PowerSlider lang={lang} steps={steps} onSelect={handleSelect} catalog={manufacturer.catalog} />
        ) : isBattery ? (
          <BatteryConfigurator lang={lang} onConfirm={confirmBattery} />
        ) : isAccessory ? (
          <AccessoryConfigurator lang={lang} onConfirm={confirmAccessory} onBack={goBack} />
        ) : (
          <OptionGrid children={children} onSelect={handleSelect} />
        )}
      </main>
    </div>
  );
}

function Header({
  lang,
  selections,
  onReset,
  logoUrl,
}: {
  lang: Lang;
  selections: ReturnType<typeof useConfigState>["selections"];
  onReset: () => void;
  logoUrl: string;
}) {
  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        <Image src={publicAsset(logoUrl)} alt="KW PV Solutions" width={140} height={32} priority />
        <div className="flex items-center gap-2">
          <CurrentSetupSidebar selections={selections} lang={lang} />
          <Button variant="ghost" size="icon" onClick={onReset} aria-label="Zurücksetzen" className="text-muted-foreground">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}

"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConfigPhase, Lang, PhaseType } from "@/data/types";
import { ACTIVE_PHASES } from "@/lib/navigation";

export interface PhaseSelection {
  phase: ConfigPhase;
  steps: string[];
  selectedProduct?: {
    product_name: string;
    value: string;
    image?: string | null;
    phaseType?: PhaseType;
    /**
     * Written by the battery phase so the accessory phase can derive
     * holding-bracket / base-plate counts without re-running the slider
     * logic. Populated only for phase === "battery".
     */
    batteryMeta?: {
      seriesKey: string;
      seriesLabel: string;
      kwh: number;
      moduleCount: number;
      model: string;
      parts: Array<{ count: number; label: string }>;
    };
    /**
     * Optional structured line items. Written by the accessory phase so the
     * server can build the PDF order list without parsing product_name.
     * Every entry is one row on the invoice / PDF product table.
     */
    items?: Array<{ name: string; qty: number; category?: string }>;
  };
}

export type InstallationType = "new" | "ac-coupling";

interface ConfigState {
  currentPhaseIndex: number;
  selections: PhaseSelection[];
  lang: Lang;
  installationType: InstallationType | null;

  selectOption: (key: string) => void;
  goBack: () => void;
  goToPhase: (index: number) => void;
  reset: () => void;
  confirmProduct: (product: PhaseSelection["selectedProduct"]) => void;
  skipPhase: () => void;
  setInstallationType: (t: InstallationType) => void;
  clearInstallationType: () => void;
}

const initialSelections = (): PhaseSelection[] =>
  ACTIVE_PHASES.map((phase) => ({ phase, steps: [] }));

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      currentPhaseIndex: 0,
      selections: initialSelections(),
      lang: "de",
      installationType: null,

      setInstallationType: (t) => set({ installationType: t }),
      clearInstallationType: () => set({ installationType: null, currentPhaseIndex: 0, selections: initialSelections() }),

      selectOption: (key) => {
        const { currentPhaseIndex, selections } = get();
        const updated = selections.map((s, i) => {
          if (i !== currentPhaseIndex) return s;
          return { ...s, steps: [...s.steps, key] };
        });
        set({ selections: updated });
      },

      confirmProduct: (product) => {
        const { currentPhaseIndex, selections } = get();
        const updated = selections.map((s, i) => {
          if (i !== currentPhaseIndex) return s;
          return { ...s, selectedProduct: product };
        });
        set({ selections: updated });
      },

      goBack: () => {
        const { currentPhaseIndex, selections } = get();
        const current = selections[currentPhaseIndex];
        if (current.steps.length > 0) {
          const updated = selections.map((s, i) => {
            if (i !== currentPhaseIndex) return s;
            return { ...s, steps: s.steps.slice(0, -1), selectedProduct: undefined };
          });
          set({ selections: updated });
        } else if (currentPhaseIndex > 0) {
          const updated = selections.map((s, i) => {
            if (i !== currentPhaseIndex - 1) return s;
            return { ...s, steps: [], selectedProduct: undefined };
          });
          set({ currentPhaseIndex: currentPhaseIndex - 1, selections: updated });
        }
      },

      skipPhase: () => {
        const { currentPhaseIndex } = get();
        if (currentPhaseIndex < ACTIVE_PHASES.length - 1) {
          set({ currentPhaseIndex: currentPhaseIndex + 1 });
        }
      },

      goToPhase: (index) => {
        const { selections } = get();
        const updated = selections.map((s, i) => {
          if (i < index) return s;
          return { phase: s.phase, steps: [] };
        });
        set({ currentPhaseIndex: index, selections: updated });
      },

      reset: () =>
        set({ currentPhaseIndex: 0, selections: initialSelections(), installationType: null }),
    }),
    // Key is suffixed with a schema version so persisted state from an
    // older schema (missing installationType, fewer phases, …) is invalidated
    // instead of leaving undefined slots.
    { name: "kw-pv-configurator-v3" }
  )
);

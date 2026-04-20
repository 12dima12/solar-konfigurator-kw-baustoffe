"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ConfigPhase, Lang } from "@/data/types";
import { ACTIVE_PHASES } from "@/lib/navigation";

export interface PhaseSelection {
  phase: ConfigPhase;
  steps: string[];
  selectedProduct?: { product_code: string; product_name: string; value: string; image?: string | null };
}

interface ConfigState {
  currentPhaseIndex: number;
  selections: PhaseSelection[];
  lang: Lang;

  selectOption: (key: string) => void;
  goBack: () => void;
  goToPhase: (index: number) => void;
  setLang: (l: Lang) => void;
  reset: () => void;
  confirmProduct: (product: PhaseSelection["selectedProduct"]) => void;
  skipPhase: () => void;
}

const initialSelections = (): PhaseSelection[] =>
  ACTIVE_PHASES.map((phase) => ({ phase, steps: [] }));

export const useConfigStore = create<ConfigState>()(
  persist(
    (set, get) => ({
      currentPhaseIndex: 0,
      selections: initialSelections(),
      lang: "de",

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

      setLang: (lang) => set({ lang }),

      reset: () =>
        set({ currentPhaseIndex: 0, selections: initialSelections() }),
    }),
    { name: "kw-pv-configurator" }
  )
);

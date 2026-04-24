"use client";
import { useConfigStore } from "@/store/configStore";
import { resolveNode, getChildrenSorted, isLeafNode, getPhaseTree, getActivePhases } from "@/lib/navigation";
import { scrollToTop } from "@/lib/scroll-to-top";
import type { ConfigNode } from "@/data/types";

export function useConfigState(catalog: Record<string, unknown>) {
  const { currentPhaseIndex, selections, lang, installationType, selectOption, goBack, goToPhase, confirmProduct, skipPhase, reset } =
    useConfigStore();

  // Die aktive Phasenkette hängt vom Installationsmodus ab: bei AC-Kopplung
  // überspringt der Konfigurator Inverter und Backup, weil der Kunde nur
  // einen Speicher nachrüsten will und die bestehende PV-Anlage schon hat.
  const activePhases = getActivePhases(installationType);
  const currentSelection = selections[currentPhaseIndex];
  const phase = activePhases[currentPhaseIndex];
  const steps = currentSelection?.steps ?? [];

  const currentNode = phase ? resolveNode(phase, lang, steps, catalog) : null;
  const children = currentNode ? getChildrenSorted(currentNode) : [];

  const isLeaf = currentNode ? isLeafNode(currentNode) : false;
  const isFinalPhase = currentPhaseIndex === activePhases.length - 1;

  const phaseTree = phase ? getPhaseTree(phase, lang, catalog) : null;

  const handleSelect = (key: string, node: ConfigNode) => {
    if (isLeafNode(node)) {
      confirmProduct({
        product_name: node.product_name ?? key,
        // Fallback-Reihenfolge: value (falls gesetzt) → label (für Opt-out-
        // Leaves wie "No" / "No Charger" mit value=null) → key. Ohne den
        // label-Fallback erscheint in der Zusammenfassung z.B. "Notstrom: No"
        // statt "Notstrom: Nein".
        value: node.value || node.label || key,
        image: node.image,
        phaseType: node.phaseType,
      });
      if (!isFinalPhase) {
        useConfigStore.getState().skipPhase();
      }
    } else {
      selectOption(key);
    }
    scrollToTop();
  };

  return {
    phase,
    activePhases,
    lang,
    steps,
    currentNode,
    children,
    isLeaf,
    isFinalPhase,
    currentPhaseIndex,
    selections,
    phaseTree,
    handleSelect,
    goBack,
    goToPhase,
    reset,
  };
}

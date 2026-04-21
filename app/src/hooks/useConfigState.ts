"use client";
import { useConfigStore } from "@/store/configStore";
import { resolveNode, getChildrenSorted, isLeafNode, getPhaseTree, ACTIVE_PHASES } from "@/lib/navigation";
import type { ConfigNode } from "@/data/types";

export function useConfigState(catalog: Record<string, unknown>) {
  const { currentPhaseIndex, selections, lang, selectOption, goBack, goToPhase, confirmProduct, skipPhase, reset } =
    useConfigStore();

  const currentSelection = selections[currentPhaseIndex];
  const phase = ACTIVE_PHASES[currentPhaseIndex];
  const steps = currentSelection?.steps ?? [];

  const currentNode = resolveNode(phase, lang, steps, catalog);
  const children = currentNode ? getChildrenSorted(currentNode) : [];

  const isLeaf = currentNode ? isLeafNode(currentNode) : false;
  const isFinalPhase = currentPhaseIndex === ACTIVE_PHASES.length - 1;

  const phaseTree = getPhaseTree(phase, lang, catalog);

  const handleSelect = (key: string, node: ConfigNode) => {
    if (isLeafNode(node)) {
      confirmProduct({
        product_code: node.product_code ?? key,
        product_name: node.product_name ?? key,
        value: node.value ?? key,
        image: node.image,
      });
      if (!isFinalPhase) {
        useConfigStore.getState().skipPhase();
      }
    } else {
      selectOption(key);
    }
  };

  return {
    phase,
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

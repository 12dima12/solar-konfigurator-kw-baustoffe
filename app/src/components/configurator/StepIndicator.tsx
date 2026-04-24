"use client";
import { cn } from "@/lib/utils";
import { PHASE_LABELS } from "@/lib/constants";
import { DEFAULT_ACTIVE_PHASES } from "@/lib/navigation";
import type { ConfigPhase, Lang } from "@/data/types";
import { Check } from "lucide-react";

interface Props {
  currentPhaseIndex: number;
  lang: Lang;
  onStepClick: (index: number) => void;
  completedPhases: number[];
  /**
   * Welche Phasen im Indicator gezeigt werden sollen. Bei AC-Kopplung ist
   * die Kette kürzer (nur Batterie/Wallbox/Zubehör). Default ist die
   * vollständige "Neue Installation"-Kette für Backward-Compat.
   */
  phases?: ConfigPhase[];
}

export function StepIndicator({ currentPhaseIndex, lang, onStepClick, completedPhases, phases = DEFAULT_ACTIVE_PHASES }: Props) {
  return (
    <nav aria-label="Konfigurations-Fortschritt" className="mb-8">
      <ol className="flex items-center gap-0">
        {phases.map((phase, i) => {
          const isDone = completedPhases.includes(i);
          const isCurrent = i === currentPhaseIndex;
          const isClickable = isDone && !isCurrent;

          return (
            <li key={phase} className="flex items-center flex-1">
              <button
                onClick={() => isClickable && onStepClick(i)}
                disabled={!isClickable && !isCurrent}
                className={cn(
                  "flex flex-col items-center gap-1 flex-1 group",
                  isClickable ? "cursor-pointer" : "cursor-default"
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200",
                    isDone && "bg-primary text-primary-foreground",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20 animate-pulse",
                    !isDone && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isDone && !isCurrent ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-medium hidden sm:block",
                    isCurrent ? "text-primary" : isDone ? "text-primary/70" : "text-muted-foreground"
                  )}
                >
                  {(PHASE_LABELS as Record<string, Record<string, string>>)[phase]?.[lang] ?? phase}
                </span>
              </button>

              {i < phases.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 flex-1 mx-1 transition-colors duration-300",
                    completedPhases.includes(i) ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

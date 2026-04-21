"use client";
import { createContext, useContext, type ReactNode } from "react";
import type { ManufacturerMeta, ManufacturerRules } from "@/manufacturers/types";
import { getRules } from "@/manufacturers/rules-registry";

// Only serializable data crosses the server→client boundary.
export interface ManufacturerContextValue {
  meta: ManufacturerMeta;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalog: Record<string, any>;
  rules: ManufacturerRules;
}

const ManufacturerContext = createContext<ManufacturerContextValue | null>(null);

export function ManufacturerProvider({
  meta,
  catalog,
  children,
}: {
  meta: ManufacturerMeta;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalog: Record<string, any>;
  children: ReactNode;
}) {
  const rules: ManufacturerRules = getRules(meta.slug) ?? {
    filterOptions: (_phase, _lang, options, _selections) => options,
    validateCombination: () => ({ valid: true }),
  };

  return (
    <ManufacturerContext.Provider value={{ meta, catalog, rules }}>
      {children}
    </ManufacturerContext.Provider>
  );
}

export function useManufacturer(): ManufacturerContextValue {
  const ctx = useContext(ManufacturerContext);
  if (!ctx) throw new Error("useManufacturer must be used inside ManufacturerProvider");
  return ctx;
}

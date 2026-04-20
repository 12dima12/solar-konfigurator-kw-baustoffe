"use client";
// Client-side rules registry — maps slug to rules implementation.
// Rules contain functions and cannot be passed across the server/client boundary.
import type { ManufacturerRules } from "./types";
import solaxRules from "./solax/rules";

const RULES: Record<string, ManufacturerRules> = {
  solax: solaxRules,
};

export function getRules(slug: string): ManufacturerRules | null {
  return RULES[slug] ?? null;
}

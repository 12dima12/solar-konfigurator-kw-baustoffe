import type { ManufacturerRules } from "../types";

// Minimal rules — override only what your manufacturer needs.
const rules: ManufacturerRules = {
  filterOptions(_phase, _lang, options) {
    return options;
  },
  validateCombination(_selections) {
    return { valid: true };
  },
};

export default rules;

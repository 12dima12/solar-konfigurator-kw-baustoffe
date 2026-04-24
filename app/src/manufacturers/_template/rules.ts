import type { ManufacturerRules } from "../types";

// Minimal rules — override only what your manufacturer needs.
const rules: ManufacturerRules = {
  filterOptions(_phase, _lang, options, _selections, _installationType) {
    return options;
  },
  validateCombination(_selections, _installationType) {
    return { valid: true };
  },
};

export default rules;

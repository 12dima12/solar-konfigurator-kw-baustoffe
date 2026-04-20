import type { Manufacturer } from "../types";
import meta from "./meta";
import rules from "./rules";
import catalog from "./catalog.json";

const solax: Manufacturer = {
  meta,
  catalog: catalog as Record<string, unknown>,
  rules,
};

export default solax;

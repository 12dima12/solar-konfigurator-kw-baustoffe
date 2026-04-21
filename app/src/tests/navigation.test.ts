import { describe, it, expect } from "vitest";
import { getPhaseTree, resolveNode, getChildrenSorted, isLeafNode } from "../lib/navigation";
import solaxCatalog from "../manufacturers/solax/catalog.json";

const catalog = solaxCatalog as Record<string, unknown>;

describe("getPhaseTree", () => {
  it("returns tree for inverter/de", () => {
    const tree = getPhaseTree("inverter", "de", catalog);
    expect(tree).not.toBeNull();
    expect(Object.keys(tree!)).toContain("IES");
    expect(Object.keys(tree!)).toContain("Split System");
  });
  it("returns null for unknown phase", () => {
    const tree = getPhaseTree("accessory" as "inverter", "de", catalog);
    expect(tree).toBeNull();
  });
});

describe("resolveNode", () => {
  it("resolves IES category node", () => {
    const node = resolveNode("inverter", "de", ["IES"], catalog);
    expect(node).not.toBeNull();
    expect(node?.children).toBeDefined();
  });
  it("resolves leaf node under IES", () => {
    const node = resolveNode("inverter", "de", ["IES", "4.0 kW"], catalog);
    expect(node).not.toBeNull();
    expect(isLeafNode(node!)).toBe(true);
  });
  it("resolves empty steps as root", () => {
    const node = resolveNode("inverter", "de", [], catalog);
    expect(node?.children).toBeDefined();
  });
});

describe("getChildrenSorted", () => {
  it("sorts by priority", () => {
    const node = resolveNode("inverter", "de", ["IES"], catalog);
    const children = getChildrenSorted(node!);
    expect(children.length).toBeGreaterThan(0);
    const priorities = children.map(([, n]) => n.priority ?? 999);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });
});

describe("isLeafNode", () => {
  it("IES is not a leaf", () => {
    const tree = getPhaseTree("inverter", "de", catalog)!;
    expect(isLeafNode(tree["IES"])).toBe(false);
  });
  it("IES 4.0 kW is a leaf", () => {
    const node = resolveNode("inverter", "de", ["IES", "4.0 kW"], catalog);
    expect(isLeafNode(node!)).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { getStockStatus, getStockLabel } from "../lib/stock";

describe("getStockStatus", () => {
  it("returns unavailable when both 0", () => {
    expect(getStockStatus({ totalAvailable: 0, totalOrdered: 0 })).toBe("unavailable");
  });
  it("returns on-order when available=0 but ordered>0", () => {
    expect(getStockStatus({ totalAvailable: 0, totalOrdered: 5 })).toBe("on-order");
  });
  it("returns low when available < 10", () => {
    expect(getStockStatus({ totalAvailable: 5, totalOrdered: 0 })).toBe("low");
  });
  it("returns available when >= 10", () => {
    expect(getStockStatus({ totalAvailable: 10, totalOrdered: 0 })).toBe("available");
  });
  it("returns available for null", () => {
    expect(getStockStatus(null)).toBe("available");
  });
});

describe("getStockLabel", () => {
  it("shows ordered count", () => {
    const label = getStockLabel({ totalAvailable: 0, totalOrdered: 98 }, "de");
    expect(label).toBe("Unterwegs: 98 Stück");
  });
  it("shows > 1000 when over 1000", () => {
    const label = getStockLabel({ totalAvailable: 1500, totalOrdered: 0 }, "de");
    expect(label).toBe("> 1000 Stück");
  });
  it("shows unavailable", () => {
    const label = getStockLabel({ totalAvailable: 0, totalOrdered: 0 }, "de");
    expect(label).toBe("Nicht verfügbar");
  });
});

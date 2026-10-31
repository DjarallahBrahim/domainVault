import { describe, expect, it } from "vitest";
import {
  atomPriceSuggestions,
  isAtomRemovable,
  parseAtomListingType,
  resolveAtomPrice,
  validateAtomPrice,
} from "@/lib/atom/pricing";
import type { AtomListing } from "@/types/atom";

const listing = (selling: number | null): AtomListing =>
  ({
    selling_price: selling,
  }) as AtomListing;

const maps = {
  afternic: new Map([["a", { buynow_price: 1200 }]]),
  sedo: new Map([["a", { sedo_price: 900 }]]),
  spaceship: new Map([["a", { spaceship_price: 750 }]]),
  atom: new Map([["a", listing(1100)]]),
};

describe("validateAtomPrice", () => {
  it("accepts positive prices and rounds to cents", () => {
    expect(validateAtomPrice("1299.999")).toBe(1300);
    expect(validateAtomPrice(20)).toBe(20);
  });

  it("rejects zero, negative, and non-numeric prices", () => {
    expect(validateAtomPrice(0)).toBeNull();
    expect(validateAtomPrice(-5)).toBeNull();
    expect(validateAtomPrice("abc")).toBeNull();
  });
});

describe("resolveAtomPrice", () => {
  it("resolves each cross-marketplace source independently", () => {
    expect(resolveAtomPrice("afternic", "a", 0, null, maps)).toBe(1200);
    expect(resolveAtomPrice("sedo", "a", 0, null, maps)).toBe(900);
    expect(resolveAtomPrice("spaceship", "a", 0, null, maps)).toBe(750);
  });

  it("falls back to the manual price and BIN", () => {
    expect(resolveAtomPrice("manual", "a", 400, 2000, maps)).toBe(400);
    expect(resolveAtomPrice("bin", "a", 0, 2000, maps)).toBe(2000);
  });

  it("returns null when the source has no price", () => {
    expect(resolveAtomPrice("afternic", "missing", 0, null, maps)).toBeNull();
  });
});

describe("atomPriceSuggestions", () => {
  it("returns BIN, -20% and -30% chips", () => {
    expect(atomPriceSuggestions(1000)).toEqual([
      { label: "BIN", value: 1000 },
      { label: "BIN −20%", value: 800 },
      { label: "BIN −30%", value: 700 },
    ]);
    expect(atomPriceSuggestions(null)).toEqual([]);
  });
});

describe("parseAtomListingType", () => {
  it("accepts the four supported types", () => {
    expect(parseAtomListingType("premium")).toBe("premium");
    expect(parseAtomListingType("plus")).toBe("plus");
    expect(parseAtomListingType("GEO")).toBe("geo");
    expect(parseAtomListingType("standard")).toBe("standard");
    expect(parseAtomListingType("something")).toBe("standard");
  });
});

describe("isAtomRemovable", () => {
  it("allows Standard and Plus only", () => {
    expect(isAtomRemovable("standard")).toBe(true);
    expect(isAtomRemovable("plus")).toBe(true);
    expect(isAtomRemovable("premium")).toBe(false);
    expect(isAtomRemovable("geo")).toBe(false);
  });
});

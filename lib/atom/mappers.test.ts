import { describe, expect, it } from "vitest";
import { fallbackAtomPayload, mapAtomDomain, normalizeAtomListingType } from "@/lib/atom/mappers";

describe("normalizeAtomListingType", () => {
  it("recognises Standard, Premium, Plus and Geo", () => {
    expect(normalizeAtomListingType("Standard")).toBe("standard");
    expect(normalizeAtomListingType("Premium")).toBe("premium");
    expect(normalizeAtomListingType("Plus")).toBe("plus");
    expect(normalizeAtomListingType("Geo")).toBe("geo");
  });

  it("falls back to standard for unknown labels", () => {
    expect(normalizeAtomListingType("Something new")).toBe("standard");
    expect(normalizeAtomListingType(null)).toBe("standard");
  });
});

describe("mapAtomDomain", () => {
  it("normalises the domain and coerces numeric prices", () => {
    const payload = mapAtomDomain({
      id: 2725,
      domain_name: "Grandopia.COM",
      status: "Seller Approved",
      full_price: 9999,
      selling_price: "1299.5",
      discount: "10",
      listing_type: "Premium",
      primary_category: "Aerospace",
    });

    expect(payload.domain_name).toBe("grandopia.com");
    expect(payload.atom_id).toBe(2725);
    expect(payload.list_status).toBe("Seller Approved");
    expect(payload.selling_price).toBe(1299.5);
    expect(payload.full_price).toBe(9999);
    expect(payload.discount).toBe(10);
    expect(payload.listing_type).toBe("premium");
    expect(payload.listing_type_raw).toBe("Premium");
    expect(payload.primary_category).toBe("Aerospace");
  });

  it("treats a zero full_price as no strike-through price", () => {
    const payload = mapAtomDomain({
      domain_name: "cirro.com",
      status: "Approved",
      full_price: 0,
      selling_price: 126299,
      listing_type: "Premium",
    });

    expect(payload.full_price).toBeNull();
    expect(payload.selling_price).toBe(126299);
  });

  it("keeps unknown statuses instead of forcing an enum", () => {
    const payload = mapAtomDomain({
      domain_name: "x.com",
      status: "Transfer Complete",
      listing_type: "Standard",
    });

    expect(payload.list_status).toBe("Transfer Complete");
  });
});

describe("fallbackAtomPayload", () => {
  it("builds a pending row from the submitted price", () => {
    const payload = fallbackAtomPayload("Example.COM", 500, "geo");

    expect(payload.domain_name).toBe("example.com");
    expect(payload.selling_price).toBe(500);
    expect(payload.listing_type).toBe("geo");
    expect(payload.list_status).toBe("pending");
    expect(payload.atom_id).toBeNull();
  });
});

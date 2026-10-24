import { describe, expect, it } from "vitest";
import {
  landerBadge,
  landerBadgeTooltip,
  listingLanderBadge,
  validateLanderOptions,
  validateLanderPatch,
} from "@/lib/afternic/lander";

const base = {
  intakeStyle: "CUSTOM_LANDER" as const,
  buynowUsd: 500,
  minbidUsd: 100,
  leasingEnabled: true,
  maxLeasePeriod: 36,
};

describe("validateLanderOptions", () => {
  it("accepts Buy Now only", () => {
    expect(
      validateLanderOptions({
        ...base,
        show: { buynow: true, makeOffer: false, lease: false },
      }).ok
    ).toBe(true);
  });

  it("accepts Buy Now + Make Offer", () => {
    expect(
      validateLanderOptions({
        ...base,
        show: { buynow: true, makeOffer: true, lease: false },
      }).ok
    ).toBe(true);
  });

  it("accepts all three methods", () => {
    expect(
      validateLanderOptions({
        ...base,
        show: { buynow: true, makeOffer: true, lease: true },
      }).ok
    ).toBe(true);
  });

  it("rejects Lease to Own without a Buy Now price", () => {
    const result = validateLanderOptions({
      ...base,
      buynowUsd: null,
      show: { buynow: false, makeOffer: false, lease: true },
    });
    expect(result.ok).toBe(false);
  });

  it("rejects Lease to Own with an out-of-range payment count", () => {
    expect(
      validateLanderOptions({
        ...base,
        maxLeasePeriod: 1,
        show: { buynow: true, makeOffer: false, lease: true },
      }).ok
    ).toBe(false);

    expect(
      validateLanderOptions({
        ...base,
        maxLeasePeriod: 61,
        show: { buynow: true, makeOffer: false, lease: true },
      }).ok
    ).toBe(false);
  });

  it("rejects Make Offer below the $20 minimum", () => {
    expect(
      validateLanderOptions({
        ...base,
        minbidUsd: 15,
        show: { buynow: true, makeOffer: true, lease: false },
      }).ok
    ).toBe(false);
  });

  it("rejects a Custom lander with no method selected", () => {
    expect(
      validateLanderOptions({
        ...base,
        show: { buynow: false, makeOffer: false, lease: false },
      }).ok
    ).toBe(false);
  });

  it("ignores flags for non-Custom landers", () => {
    expect(
      validateLanderOptions({
        ...base,
        intakeStyle: "BUYNOW",
        show: { buynow: false, makeOffer: false, lease: false },
      }).ok
    ).toBe(true);
  });
});

describe("validateLanderPatch", () => {
  it("returns nothing when no show flag is present", () => {
    expect(validateLanderPatch({ buynow: 500 })).toEqual([]);
  });

  it("rejects an all-false explicit combination", () => {
    expect(
      validateLanderPatch({
        showLanderBuynowOption: false,
        showLanderMakeOfferOption: false,
        showLanderLeaseToOwnOption: false,
      })
    ).not.toEqual([]);
  });

  it("rejects enabling Lease to Own with a zero price or invalid period", () => {
    expect(
      validateLanderPatch({
        showLanderLeaseToOwnOption: true,
        buynow: 0,
        maxLeasePeriod: 36,
      })
    ).not.toEqual([]);

    expect(
      validateLanderPatch({
        showLanderLeaseToOwnOption: true,
        maxLeasePeriod: 1,
      })
    ).not.toEqual([]);
  });

  it("rejects enabling Make Offer below $20", () => {
    expect(
      validateLanderPatch({
        showLanderMakeOfferOption: true,
        minbid: 10,
      })
    ).not.toEqual([]);
  });

  it("accepts a single valid enable", () => {
    expect(validateLanderPatch({ showLanderBuynowOption: true })).toEqual([]);
  });
});

describe("landerBadge", () => {
  it("orders enabled methods as BN · MO · LTO", () => {
    expect(landerBadge({ buynow: true, makeOffer: true, lease: true })).toBe("BN · MO · LTO");
  });

  it("returns an empty string when nothing is enabled", () => {
    expect(landerBadge({ buynow: false, makeOffer: false, lease: false })).toBe("");
  });

  it("returns a single method", () => {
    expect(landerBadge({ buynow: false, makeOffer: true, lease: false })).toBe("MO");
  });

  it("builds a readable tooltip", () => {
    expect(landerBadgeTooltip({ buynow: true, makeOffer: true, lease: false })).toBe(
      "Buy Now · Make Offer"
    );
  });
});

describe("listingLanderBadge", () => {
  const baseListing = {
    intake_style: "CUSTOM_LANDER" as const,
    show_lander_buynow: true,
    show_lander_makeoffer: true,
    show_lander_lease: false,
  };

  it("shows methods for a Custom lander", () => {
    expect(listingLanderBadge(baseListing)).toBe("BN · MO");
  });

  it("shows RP for a Request Price lander", () => {
    expect(listingLanderBadge({ ...baseListing, intake_style: "PRICE_FORM" })).toBe("RP");
  });

  it("shows nothing for a Buy it Now lander", () => {
    expect(listingLanderBadge({ ...baseListing, intake_style: "BUYNOW" })).toBe("");
  });
});

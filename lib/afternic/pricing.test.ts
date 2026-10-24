import { describe, expect, it } from "vitest";
import {
  buildAfternicPatch,
  buildAfternicPayload,
  clampMinbid,
  fromMicro,
  toMicro,
} from "@/lib/afternic/pricing";

describe("micro conversion", () => {
  it("converts whole dollars to microunits", () => {
    expect(toMicro(500)).toBe(500_000_000);
  });

  it("rounds cents away", () => {
    expect(toMicro(500.6)).toBe(501_000_000);
  });

  it("is null-safe", () => {
    expect(toMicro(null)).toBeNull();
    expect(toMicro(undefined)).toBeNull();
    expect(fromMicro(null)).toBeNull();
  });

  it("converts microunits back to dollars", () => {
    expect(fromMicro(500_000_000)).toBe(500);
  });

  it("clamps the minimum bid to $20", () => {
    expect(clampMinbid(5)).toBe(20);
  });
});

describe("buildAfternicPayload", () => {
  it("uses a Sales lander and converts prices", () => {
    const payload = buildAfternicPayload({
      name: "example.com",
      buynow: 500,
      minbid: 100,
    });

    expect(payload).toMatchObject({
      name: "example.com",
      landingPage: "SALES_TYPE",
      intakeStyle: "BUYNOW",
      buynowPrice: 500_000_000,
      minbidPrice: 100_000_000,
    });
  });

  it("includes custom lander flags when supplied", () => {
    const payload = buildAfternicPayload({
      name: "example.com",
      buynow: 500,
      intakeStyle: "CUSTOM_LANDER",
      showLanderBuynowOption: true,
      showLanderMakeOfferOption: true,
      showLanderLeaseToOwnOption: false,
    });

    expect(payload.showLanderBuynowOption).toBe(true);
    expect(payload.showLanderMakeOfferOption).toBe(true);
    expect(payload.showLanderLeaseToOwnOption).toBe(false);
  });
});

describe("buildAfternicPatch", () => {
  it("contains only the supplied fields", () => {
    expect(buildAfternicPatch({ buynow: 500 })).toEqual({
      buynowPrice: 500_000_000,
    });
  });

  it("pins the Custom Sales lander when a show flag changes", () => {
    const patch = buildAfternicPatch({
      showLanderMakeOfferOption: true,
      minbid: 100,
    });

    expect(patch.intakeStyle).toBe("CUSTOM_LANDER");
    expect(patch.landingPage).toBe("SALES_TYPE");
    expect(patch.showLanderMakeOfferOption).toBe(true);
  });

  it("enabling Lease to Own also enables leasing and keeps the period", () => {
    const patch = buildAfternicPatch({
      showLanderLeaseToOwnOption: true,
      maxLeasePeriod: 36,
      buynow: 500,
    });

    expect(patch.showLanderLeaseToOwnOption).toBe(true);
    expect(patch.leasingEnabled).toBe(true);
    expect(patch.maxLeasePeriod).toBe(36);
  });

  it("disabling Lease to Own also disables leasing", () => {
    const patch = buildAfternicPatch({
      showLanderLeaseToOwnOption: false,
    });

    expect(patch.showLanderLeaseToOwnOption).toBe(false);
    expect(patch.leasingEnabled).toBe(false);
    expect(patch.intakeStyle).toBe("CUSTOM_LANDER");
  });

  it("never sends untouched fields", () => {
    const patch = buildAfternicPatch({ hidden: true });
    expect(Object.keys(patch)).toEqual(["hidden"]);
  });
});

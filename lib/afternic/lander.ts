import type { AfternicIntakeStyle, AfternicPatchChanges } from "@/types/afternic";

/** Independent sales methods shown on a Custom lander. */
export interface LanderOptions {
  buynow: boolean;
  makeOffer: boolean;
  lease: boolean;
}

const MIN_LEASE_PERIOD = 2;
const MAX_LEASE_PERIOD = 60;

/**
 * Validates the sales-method combination for a Custom lander.
 * Non-Custom landers ignore all `show*` flags, so they always pass.
 */
export function validateLanderOptions(input: {
  intakeStyle: AfternicIntakeStyle;
  buynowUsd: number | null;
  minbidUsd: number | null;
  leasingEnabled: boolean;
  maxLeasePeriod: number | null;
  show: LanderOptions;
}): { ok: boolean; errors: string[] } {
  const errors: string[] = [];

  if (input.intakeStyle !== "CUSTOM_LANDER") {
    return { ok: true, errors };
  }

  const { show } = input;

  if (!show.buynow && !show.makeOffer && !show.lease) {
    errors.push("Choose at least one sales method");
  }
  if (show.buynow && !(input.buynowUsd && input.buynowUsd > 0)) {
    errors.push("Buy Now requires a Buy Now price");
  }
  if (show.makeOffer && !(input.minbidUsd !== null && input.minbidUsd >= 20)) {
    errors.push("Make Offer requires a minimum offer of at least $20");
  }
  if (show.lease) {
    if (!input.leasingEnabled) {
      errors.push("Lease to Own must be enabled");
    }
    if (!(input.buynowUsd && input.buynowUsd > 0)) {
      errors.push("Lease to Own requires a Buy Now price");
    }
    const payments = input.maxLeasePeriod;
    if (payments === null || payments < MIN_LEASE_PERIOD || payments > MAX_LEASE_PERIOD) {
      errors.push("Lease to Own payments must be between 2 and 60");
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Validates a PATCH that changes lander flags without necessarily including
 * every price. Catches the unambiguous errors only (all-false, obviously
 * invalid supplied prices/period) so it can be used per bulk item.
 */
export function validateLanderPatch(changes: AfternicPatchChanges): string[] {
  const hasShowFlags =
    changes.showLanderBuynowOption !== undefined ||
    changes.showLanderMakeOfferOption !== undefined ||
    changes.showLanderLeaseToOwnOption !== undefined;

  if (!hasShowFlags) return [];

  const errors: string[] = [];

  if (
    changes.showLanderBuynowOption === false &&
    changes.showLanderMakeOfferOption === false &&
    changes.showLanderLeaseToOwnOption === false
  ) {
    errors.push("Choose at least one sales method");
  }

  if (
    changes.showLanderBuynowOption === true &&
    changes.buynow !== undefined &&
    changes.buynow <= 0
  ) {
    errors.push("Buy Now requires a Buy Now price");
  }

  if (
    changes.showLanderMakeOfferOption === true &&
    changes.minbid !== undefined &&
    changes.minbid < 20
  ) {
    errors.push("Make Offer requires a minimum offer of at least $20");
  }

  if (changes.showLanderLeaseToOwnOption === true) {
    if (changes.buynow !== undefined && changes.buynow <= 0) {
      errors.push("Lease to Own requires a Buy Now price");
    }
    if (
      changes.maxLeasePeriod !== undefined &&
      (changes.maxLeasePeriod < MIN_LEASE_PERIOD || changes.maxLeasePeriod > MAX_LEASE_PERIOD)
    ) {
      errors.push("Lease to Own payments must be between 2 and 60");
    }
  }

  return errors;
}

/** Compact badge text, e.g. `BN · MO · LTO`. */
export function landerBadge(options: LanderOptions): string {
  const parts: string[] = [];
  if (options.buynow) parts.push("BN");
  if (options.makeOffer) parts.push("MO");
  if (options.lease) parts.push("LTO");
  return parts.join(" · ");
}

/** Human-readable method names for the badge tooltip. */
export function landerBadgeTooltip(options: LanderOptions): string {
  const parts: string[] = [];
  if (options.buynow) parts.push("Buy Now");
  if (options.makeOffer) parts.push("Make Offer");
  if (options.lease) parts.push("Lease to Own");
  return parts.length > 0 ? parts.join(" · ") : "No sales methods";
}

/** Badge for a cached listing (Custom → methods, Request Price → RP). */
export function listingLanderBadge(listing: {
  intake_style: AfternicIntakeStyle;
  show_lander_buynow: boolean;
  show_lander_makeoffer: boolean;
  show_lander_lease: boolean;
}): string {
  if (listing.intake_style === "CUSTOM_LANDER") {
    return landerBadge({
      buynow: listing.show_lander_buynow,
      makeOffer: listing.show_lander_makeoffer,
      lease: listing.show_lander_lease,
    });
  }
  if (listing.intake_style === "PRICE_FORM") return "RP";
  return "";
}

/** Tooltip for a cached listing's lander badge. */
export function listingLanderTooltip(listing: {
  intake_style: AfternicIntakeStyle;
  show_lander_buynow: boolean;
  show_lander_makeoffer: boolean;
  show_lander_lease: boolean;
}): string {
  if (listing.intake_style === "CUSTOM_LANDER") {
    return landerBadgeTooltip({
      buynow: listing.show_lander_buynow,
      makeOffer: listing.show_lander_makeoffer,
      lease: listing.show_lander_lease,
    });
  }
  if (listing.intake_style === "PRICE_FORM") return "Request Price lander";
  return "Buy it Now lander";
}

import type {
  AfternicIntakeStyle,
  AfternicLandingPage,
  AfternicPatchChanges,
} from "@/types/afternic";

/** Afternic represents USD as integer microunits: 1 USD = 1,000,000. */
export const MICRO = 1_000_000;

/** Minimum accepted minimum-bid price, in whole USD. */
export const MIN_BID_USD = 20;

/** Maximum accepted Buy Now price, in whole USD. */
export const MAX_BUYNOW_USD = 49_999_999;

export function toMicro(usd: number | null | undefined): number | null {
  if (usd === null || usd === undefined || Number.isNaN(usd)) return null;
  return Math.round(usd) * MICRO;
}

export function fromMicro(micro: number | null | undefined): number | null {
  if (micro === null || micro === undefined || Number.isNaN(micro)) return null;
  return micro / MICRO;
}

/** True when the value has a non-zero fractional part. */
export function hasCents(usd: number): boolean {
  return Math.abs(usd - Math.round(usd)) > 0.0001;
}

export function clampBuynow(usd: number): number {
  return Math.min(Math.max(Math.round(usd), 1), MAX_BUYNOW_USD);
}

export function clampMinbid(usd: number): number {
  return Math.min(Math.max(Math.round(usd), MIN_BID_USD), MAX_BUYNOW_USD);
}

interface Chip {
  label: string;
  value: number;
}

/** Buy Now suggestions derived from the portfolio BIN. */
export function buynowSuggestions(bin: number | null): Chip[] {
  if (!bin) return [];
  return [
    { label: "BIN", value: Math.round(bin) },
    { label: "BIN −20%", value: Math.round(bin * 0.8) },
    { label: "BIN −30%", value: Math.round(bin * 0.7) },
  ];
}

/** Min-offer suggestions derived from the current Buy Now price. */
export function minbidSuggestions(buynow: number): Chip[] {
  if (!buynow || buynow <= 0) return [];
  return [0.2, 0.3, 0.4, 0.5].map((pct) => ({
    label: `${Math.round(pct * 100)}%`,
    value: clampMinbid(buynow * pct),
  }));
}

export function buildAfternicPayload(input: {
  name: string;
  buynow: number | null;
  minbid?: number | null;
  floor?: number | null;
  displayName?: string | null;
  intakeStyle?: AfternicIntakeStyle;
  landingPage?: AfternicLandingPage;
  leasingEnabled?: boolean;
  maxLeasePeriod?: number | null;
  showLanderLeaseToOwnOption?: boolean;
  showLanderBuynowOption?: boolean;
  showLanderMakeOfferOption?: boolean;
}): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: input.name,
    landingPage: input.landingPage ?? "SALES_TYPE",
    intakeStyle: input.intakeStyle ?? "BUYNOW",
  };

  if (input.buynow !== null && input.buynow !== undefined) {
    payload.buynowPrice = toMicro(clampBuynow(input.buynow));
  }
  if (input.minbid !== null && input.minbid !== undefined) {
    payload.minbidPrice = toMicro(clampMinbid(input.minbid));
  }
  if (input.floor !== null && input.floor !== undefined) {
    payload.floorPrice = toMicro(Math.max(0, Math.round(input.floor)));
  }
  if (input.displayName) payload.displayName = input.displayName;

  if (input.leasingEnabled !== undefined) {
    payload.leasingEnabled = input.leasingEnabled;
  }
  if (input.maxLeasePeriod !== undefined && input.maxLeasePeriod !== null) {
    payload.maxLeasePeriod = Math.min(60, Math.max(2, Math.round(input.maxLeasePeriod)));
  }
  if (input.showLanderLeaseToOwnOption !== undefined) {
    payload.showLanderLeaseToOwnOption = input.showLanderLeaseToOwnOption;
  }
  if (input.showLanderBuynowOption !== undefined) {
    payload.showLanderBuynowOption = input.showLanderBuynowOption;
  }
  if (input.showLanderMakeOfferOption !== undefined) {
    payload.showLanderMakeOfferOption = input.showLanderMakeOfferOption;
  }

  return payload;
}

/**
 * Builds a PATCH body containing ONLY the fields the caller chose to change.
 * Never sends defaults, so untouched listing settings stay as they are.
 */
export function buildAfternicPatch(changes: AfternicPatchChanges): Record<string, unknown> {
  const body: Record<string, unknown> = {};

  if (changes.buynow !== undefined) {
    body.buynowPrice = toMicro(clampBuynow(changes.buynow));
  }
  if (changes.minbid !== undefined) {
    body.minbidPrice = toMicro(clampMinbid(changes.minbid));
  }
  if (changes.floor !== undefined) {
    body.floorPrice = toMicro(Math.max(0, Math.round(changes.floor)));
  }
  if (changes.displayName !== undefined) {
    body.displayName = changes.displayName;
  }
  if (changes.intakeStyle !== undefined) {
    body.intakeStyle = changes.intakeStyle;
  }
  if (changes.landingPage !== undefined) {
    body.landingPage = changes.landingPage;
  }
  if (changes.hidden !== undefined) body.hidden = changes.hidden;
  if (changes.featured !== undefined) body.featured = changes.featured;
  if (changes.leasingEnabled !== undefined && changes.showLanderLeaseToOwnOption === undefined) {
    body.leasingEnabled = changes.leasingEnabled;
  }
  if (changes.maxLeasePeriod !== undefined) {
    body.maxLeasePeriod = Math.min(60, Math.max(2, Math.round(changes.maxLeasePeriod)));
  }
  if (changes.showLanderBuynowOption !== undefined) {
    body.showLanderBuynowOption = changes.showLanderBuynowOption;
  }
  if (changes.showLanderMakeOfferOption !== undefined) {
    body.showLanderMakeOfferOption = changes.showLanderMakeOfferOption;
  }
  if (changes.showLanderLeaseToOwnOption !== undefined) {
    body.showLanderLeaseToOwnOption = changes.showLanderLeaseToOwnOption;
    // Enabling/disabling the lander option also drives the lease setting.
    body.leasingEnabled = changes.showLanderLeaseToOwnOption;
  }

  // A sales-method flag only applies on a Custom sales lander. Changing any
  // flag therefore pins both lander fields so the flags take effect.
  const hasShowFlags =
    changes.showLanderBuynowOption !== undefined ||
    changes.showLanderMakeOfferOption !== undefined ||
    changes.showLanderLeaseToOwnOption !== undefined;
  if (hasShowFlags) {
    body.intakeStyle = "CUSTOM_LANDER";
    body.landingPage = "SALES_TYPE";
  }

  return body;
}

import type { AtomListingType, AtomPriceSource } from "@/types/atom";

export interface PriceSuggestion {
  label: string;
  value: number;
}

const round = (n: number) => Math.round(n);

/** Returns a valid positive price, or null when the value cannot be used. */
export function validateAtomPrice(value: unknown): number | null {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return null;
  return round(num);
}

export function atomPriceSuggestions(bin: number | null): PriceSuggestion[] {
  if (!bin) return [];

  return [
    { label: "BIN", value: bin },
    { label: "BIN −20%", value: round(bin * 0.8) },
    { label: "BIN −30%", value: round(bin * 0.7) },
  ];
}

export const ATOM_PRICE_SOURCE_LABELS: Record<AtomPriceSource, string> = {
  manual: "manual",
  bin: "BIN",
  afternic: "Afternic",
  sedo: "Sedo",
  spaceship: "Spaceship",
};

interface PriceMaps {
  afternic?: Map<string, { buynow_price: number | null }>;
  sedo?: Map<string, { sedo_price: number | null }>;
  spaceship?: Map<string, { spaceship_price: number | null }>;
}

/**
 * Resolves the price for one domain from the selected source.
 * Returns null when the source has no usable price for that domain.
 */
export function resolveAtomPrice(
  source: AtomPriceSource,
  domainId: string,
  manualPrice: number,
  bin: number | null,
  maps: PriceMaps = {}
): number | null {
  switch (source) {
    case "manual":
      return validateAtomPrice(manualPrice);
    case "bin":
      return validateAtomPrice(bin);
    case "afternic":
      return validateAtomPrice(maps.afternic?.get(domainId)?.buynow_price);
    case "sedo":
      return validateAtomPrice(maps.sedo?.get(domainId)?.sedo_price);
    case "spaceship":
      return validateAtomPrice(maps.spaceship?.get(domainId)?.spaceship_price);
    default:
      return null;
  }
}

/** Normalises a listing type coming from a form or the API. */
export function parseAtomListingType(value: unknown): AtomListingType {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase();
  if (raw === "premium" || raw === "plus" || raw === "geo") return raw;
  return "standard";
}

/**
 * Atom's Seller API allows removing Standard and Plus listings.
 * Premium removals require the Atom dashboard and a 30-day notice; Geo is not
 * supported by the removal endpoint.
 */
export function isAtomRemovable(type: AtomListingType): boolean {
  return type === "standard" || type === "plus";
}

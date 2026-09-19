/**
 * Sales channels / marketplaces offered in the sale form platform picker.
 * Names are stored normalized (first letter upper-case, rest lower-case).
 */
export const DOMAIN_MARKETPLACES = [
  "Afternic",
  "Atom",
  "Brandbucket",
  "Brandpa",
  "Buydomains",
  "Daaz",
  "Dan",
  "Domainagents",
  "Dropcatch",
  "Dynadot",
  "Efty",
  "Epik",
  "Flippa",
  "Godaddy",
  "Namecheap",
  "Namejet",
  "Namesilo",
  "Park.io",
  "Porkbun",
  "Sav",
  "Sedo",
  "Snapnames",
  "Spaceship",
  "Uniregistry",
] as const;

/** Sentinel used by the picker when the user wants to type a custom platform. */
export const CUSTOM_PLATFORM = "__custom__";

/** Sentinel used to clear an optional platform selection. */
export const NO_PLATFORM = "__none__";

/**
 * Normalizes a platform name so the stored value is always predictable:
 * everything lower-case except the first letter.
 * "afternic"  -> "Afternic"
 * "GoDaddy Auctions" -> "Godaddy auctions"
 */
export function normalizePlatform(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

export function isKnownMarketplace(value: string): boolean {
  return (DOMAIN_MARKETPLACES as readonly string[]).includes(value);
}

export type SaleType = "inbound" | "outbound";

export const SALE_TYPE_OPTIONS: { value: SaleType; label: string }[] = [
  { value: "inbound", label: "Inbound" },
  { value: "outbound", label: "Outbound" },
];

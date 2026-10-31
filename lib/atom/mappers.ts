import type { AtomApiDomain, AtomListingType } from "@/types/atom";

/**
 * Shape written into `atom_listings` (minus the identity columns that the
 * caller supplies: `user_id` and `domain_id`).
 */
export interface AtomCachePayload {
  domain_name: string;
  atom_id: number | null;
  list_status: string;
  listing_type: AtomListingType;
  listing_type_raw: string | null;
  selling_price: number | null;
  full_price: number | null;
  discount: number | null;
  primary_category: string | null;
  logo_image: string | null;
  listed_at: string | null;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

/**
 * Atom returns labels such as `Standard`, `Plus`, `Premium`, and `Geo`.
 * Anything unrecognised is treated as Standard so the UI never blocks a
 * removal that might be allowed.
 */
export function normalizeAtomListingType(raw: unknown): AtomListingType {
  const value = String(raw ?? "")
    .trim()
    .toLowerCase();
  if (value.includes("premium")) return "premium";
  if (value.includes("plus")) return "plus";
  if (value.includes("geo")) return "geo";
  return "standard";
}

/** Maps a raw Atom domain object into a cache-row payload. */
export function mapAtomDomain(raw: AtomApiDomain): AtomCachePayload {
  const fullPrice = toNumberOrNull(raw.full_price);

  return {
    domain_name: String(raw.domain_name ?? "")
      .trim()
      .toLowerCase(),
    atom_id: toNumberOrNull(raw.id),
    list_status: String(raw.status ?? "pending").trim() || "pending",
    listing_type: normalizeAtomListingType(raw.listing_type),
    listing_type_raw: raw.listing_type ? String(raw.listing_type) : null,
    selling_price: toNumberOrNull(raw.selling_price),
    // Atom uses 0 when there is no strike-through/original price.
    full_price: fullPrice && fullPrice > 0 ? fullPrice : null,
    discount: toNumberOrNull(raw.discount),
    primary_category: raw.primary_category ? String(raw.primary_category) : null,
    logo_image: raw.logo_image ? String(raw.logo_image) : null,
    listed_at: null,
  };
}

/** Minimal cache payload used when Atom accepts a write but details fail. */
export function fallbackAtomPayload(
  domainName: string,
  price: number,
  listingType: AtomListingType
): AtomCachePayload {
  return {
    domain_name: domainName.trim().toLowerCase(),
    atom_id: null,
    list_status: "pending",
    listing_type: listingType,
    listing_type_raw: listingType,
    selling_price: price,
    full_price: null,
    discount: null,
    primary_category: null,
    logo_image: null,
    listed_at: null,
  };
}

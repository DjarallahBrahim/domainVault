/**
 * Atom.com Seller API types.
 * Prices crossing the API boundary are USD dollars (Atom has no microunits).
 * The API authenticates with `api_token` + `user_id` query parameters.
 */

export type AtomListingType = "standard" | "plus" | "premium" | "geo";

export type AtomPriceSource = "manual" | "bin" | "afternic" | "sedo" | "spaceship";

export interface AtomCredentials {
  apiToken: string;
  userId: number;
}

export interface AtomErrorBody {
  message?: string;
  error?: string;
  code?: string;
  details?: string;
  errors?: Array<{ message?: string; field?: string }>;
}

/** Cache row: public.atom_listings.Row */
export interface AtomListing {
  id: string;
  user_id: string;
  domain_id: string;
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
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

/** Raw domain shape returned by `GET /domains` and `GET /domain-details`. */
export interface AtomApiDomain {
  id?: number | null;
  domain_name: string;
  status?: string | null;
  full_price?: number | string | null;
  selling_price?: number | string | null;
  primary_category?: string | null;
  discount?: number | string | null;
  description?: string | null;
  logo_image?: string | null;
  listing_type?: string | null;
}

/** Minimal shape returned by `add-domain`, `update-selling-price`, `remove-domain`. */
export interface AtomMessageResponse {
  message?: string;
}

export interface AtomUserSettings {
  atom_api_token: string | null;
  atom_user_id: number | null;
}

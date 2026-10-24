/**
 * Afternic Portfolio API types.
 * Prices crossing the API boundary are integer microunits (1 USD = 1,000,000).
 * Prices stored in the cache table are USD dollars.
 */

export type AfternicListStatus =
  | "PENDING"
  | "FAILED_COMPLIANCE"
  | "ACTIVE"
  | "HIDDEN"
  | "ON_HOLD"
  | "SOLD"
  | "INACTIVE";

export type AfternicFastTransferStatus =
  | "ACTIVE"
  | "AWAITING_OPT_IN"
  | "INACTIVE"
  | "INACTIVE_BUYNOW_HIGH"
  | "INACTIVE_BUYNOW_MISSING"
  | "INELIGIBLE_REGISTRAR"
  | "INELIGIBLE_TLD"
  | "PENDING_REVIEW"
  | "USER_EXCLUDED"
  | "UNKNOWN";

export type AfternicLandingPage = "SALES_TYPE" | "PARKING_TYPE";

export type AfternicIntakeStyle = "BUYNOW" | "PRICE_FORM" | "CUSTOM_LANDER";

export interface AfternicCredentials {
  apiKey: string;
  apiSecret: string;
}

/** Cache row: public.afternic_listings.Row */
export interface AfternicListing {
  id: string;
  user_id: string;
  domain_id: string;
  domain_name: string;
  display_name: string | null;
  list_status: AfternicListStatus;
  fast_transfer_status: string | null;
  buynow_price: number | null;
  floor_price: number | null;
  minbid_price: number | null;
  landing_page: AfternicLandingPage;
  intake_style: AfternicIntakeStyle;
  hidden: boolean;
  featured: boolean;
  leasing_enabled: boolean;
  max_lease_period: number | null;
  show_lander_buynow: boolean;
  show_lander_makeoffer: boolean;
  show_lander_lease: boolean;
  intake_views: number | null;
  intake_leads: number | null;
  afternic_registrar: string | null;
  listed_at: string | null;
  last_synced_at: string;
  created_at: string;
  updated_at: string;
}

/** Raw domain shape returned by the Afternic API. */
export interface AfternicApiDomain {
  name: string;
  tld?: string;
  registrar?: string;
  displayName?: string;
  listStatus: AfternicListStatus;
  fastTransferStatus?: AfternicFastTransferStatus;
  buynowPrice?: number | null;
  floorPrice?: number | null;
  minbidPrice?: number | null;
  leasingEnabled?: boolean;
  maxLeasePeriod?: number | null;
  showLanderBuynowOption?: boolean;
  showLanderMakeOfferOption?: boolean;
  showLanderLeaseToOwnOption?: boolean;
  landingPage?: AfternicLandingPage;
  intakeStyle?: AfternicIntakeStyle;
  hidden?: boolean;
  featured?: boolean;
  intakeLeads?: number | null;
  intakeViews?: number | null;
  listedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AfternicPagination {
  first?: string;
  last?: string;
  next?: string;
  previous?: string;
  total?: number;
}

export interface AfternicListResponse {
  domains: AfternicApiDomain[];
  pagination?: AfternicPagination;
}

/** Payload accepted by the API's bulk upsert endpoint. */
export interface AfternicUpsertItem {
  name: string;
  buynowPrice?: number;
  minbidPrice?: number;
  floorPrice?: number;
  displayName?: string;
  intakeStyle?: AfternicIntakeStyle;
  landingPage?: AfternicLandingPage;
  hidden?: boolean;
  leasingEnabled?: boolean;
  maxLeasePeriod?: number;
}

/** Result map returned by `/$each/*` bulk endpoints, keyed by domain name. */
export interface AfternicBulkResultItem {
  code: number;
  domain?: AfternicApiDomain;
  error?: { code?: string; message?: string; details?: string };
}

export type AfternicBulkResult = Record<string, AfternicBulkResultItem>;

/** Fields a bulk edit may change. Only provided keys are PATCHed. */
export interface AfternicPatchChanges {
  buynow?: number;
  minbid?: number;
  floor?: number;
  displayName?: string;
  intakeStyle?: AfternicIntakeStyle;
  landingPage?: AfternicLandingPage;
  hidden?: boolean;
  featured?: boolean;
  leasingEnabled?: boolean;
  maxLeasePeriod?: number;
  showLanderBuynowOption?: boolean;
  showLanderMakeOfferOption?: boolean;
  showLanderLeaseToOwnOption?: boolean;
}

export interface AfternicErrorBody {
  code?: string;
  message?: string;
  details?: string;
  fields?: Array<{ code?: string; message?: string; path?: string }>;
}

/** Insert payload for creating a listing through our own API route. */
export interface AfternicInsertRequest {
  domain: string;
  buynow: number;
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
}

/** Edit payload for updating a listing through our own API route. */
export interface AfternicEditRequest {
  domain: string;
  buynow?: number | null;
  minbid?: number | null;
  floor?: number | null;
  displayName?: string | null;
  intakeStyle?: AfternicIntakeStyle;
  landingPage?: AfternicLandingPage;
  hidden?: boolean;
  leasingEnabled?: boolean;
  maxLeasePeriod?: number | null;
  showLanderLeaseToOwnOption?: boolean;
  showLanderBuynowOption?: boolean;
  showLanderMakeOfferOption?: boolean;
}

export interface AfternicUserSettings {
  afternic_api_key: string | null;
  afternic_api_secret: string | null;
}

import { fromMicro } from "@/lib/afternic/pricing";
import type {
  AfternicApiDomain,
  AfternicBulkResult,
  AfternicIntakeStyle,
  AfternicLandingPage,
  AfternicListStatus,
} from "@/types/afternic";

/**
 * Shape written into `afternic_listings` (minus the identity columns that the
 * caller supplies: `user_id` and `domain_id`).
 */
export interface AfternicCachePayload {
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
}

const LANDING_PAGES: AfternicLandingPage[] = ["SALES_TYPE", "PARKING_TYPE"];
const INTAKE_STYLES: AfternicIntakeStyle[] = ["BUYNOW", "PRICE_FORM", "CUSTOM_LANDER"];

function asLandingPage(value: unknown): AfternicLandingPage {
  return LANDING_PAGES.includes(value as AfternicLandingPage)
    ? (value as AfternicLandingPage)
    : "SALES_TYPE";
}

function asIntakeStyle(value: unknown): AfternicIntakeStyle {
  return INTAKE_STYLES.includes(value as AfternicIntakeStyle)
    ? (value as AfternicIntakeStyle)
    : "BUYNOW";
}

/** Maps a raw Afternic domain object into a cache-row payload. */
export function mapAfternicDomain(raw: AfternicApiDomain): AfternicCachePayload {
  return {
    domain_name: String(raw.name ?? "").toLowerCase(),
    display_name: raw.displayName ?? null,
    list_status: (raw.listStatus ?? "PENDING") as AfternicListStatus,
    fast_transfer_status: raw.fastTransferStatus ?? null,
    buynow_price: fromMicro(raw.buynowPrice),
    floor_price: fromMicro(raw.floorPrice),
    minbid_price: fromMicro(raw.minbidPrice),
    landing_page: asLandingPage(raw.landingPage),
    intake_style: asIntakeStyle(raw.intakeStyle),
    hidden: Boolean(raw.hidden),
    featured: Boolean(raw.featured),
    leasing_enabled: Boolean(raw.leasingEnabled),
    max_lease_period: raw.maxLeasePeriod ?? null,
    show_lander_buynow: raw.showLanderBuynowOption ?? true,
    show_lander_makeoffer: raw.showLanderMakeOfferOption ?? false,
    show_lander_lease: raw.showLanderLeaseToOwnOption ?? false,
    intake_views: raw.intakeViews ?? null,
    intake_leads: raw.intakeLeads ?? null,
    afternic_registrar: raw.registrar ?? null,
    listed_at: raw.listedAt ?? null,
  };
}

interface BulkSummary {
  succeeded: Array<{ domain: string; payload: AfternicCachePayload }>;
  failed: Array<{ domain: string; code: number; message: string }>;
}

/**
 * Normalises the per-domain result map returned by the `/$each/*` endpoints.
 * HTTP 200 does not mean every item succeeded.
 */
export function mapBulkResult(result: AfternicBulkResult): BulkSummary {
  const succeeded: BulkSummary["succeeded"] = [];
  const failed: BulkSummary["failed"] = [];

  for (const [domain, item] of Object.entries(result ?? {})) {
    const code = Number(item?.code ?? 0);
    if (code >= 200 && code < 300 && item?.domain) {
      succeeded.push({
        domain: domain.toLowerCase(),
        payload: mapAfternicDomain(item.domain),
      });
    } else {
      failed.push({
        domain: domain.toLowerCase(),
        code: code || 500,
        message: item?.error?.message ?? `Afternic returned status ${code || "unknown"}`,
      });
    }
  }

  return { succeeded, failed };
}

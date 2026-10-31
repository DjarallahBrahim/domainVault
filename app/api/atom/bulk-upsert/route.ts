import { NextRequest, NextResponse } from "next/server";
import { assertAtomSuccess, callAtom, isAtomError } from "@/lib/atom/client";
import { fallbackAtomPayload, type AtomCachePayload } from "@/lib/atom/mappers";
import { isValidAsciiDomain, toAsciiDomain } from "@/lib/atom/names";
import { parseAtomListingType, validateAtomPrice } from "@/lib/atom/pricing";
import { authenticateAtom, readJson } from "@/lib/atom/route-helpers";
import type { AtomMessageResponse } from "@/types/atom";

interface BulkItem {
  domain?: string;
  price?: number | string;
  domainType?: string;
}

interface BulkBody {
  items?: BulkItem[];
  confirmPremium?: boolean;
}

interface Failure {
  domain: string;
  message: string;
  status: number;
}

/**
 * Bulk-adds domains to Atom. Each item is processed independently so one
 * failure does not abort the batch. Premium requires an explicit confirmation.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateAtom();
  if (!auth.ok) return auth.response;

  const body = await readJson<BulkBody>(request);
  const items = body?.items ?? [];

  if (items.length === 0) {
    return NextResponse.json({ error: "No domains supplied" }, { status: 400 });
  }
  if (items.length > 200) {
    return NextResponse.json({ error: "Add at most 200 domains per batch" }, { status: 400 });
  }

  const normalised = items.map((item) => ({
    domain: toAsciiDomain(String(item?.domain ?? "")),
    price: validateAtomPrice(item?.price),
    listingType: parseAtomListingType(item?.domainType),
  }));

  const hasPremium = normalised.some((item) => item.listingType === "premium");
  if (hasPremium && body?.confirmPremium !== true) {
    return NextResponse.json(
      {
        error:
          "Premium listings cost 1 coin each and cannot be removed through the API. Confirm the coin spend to continue.",
      },
      { status: 400 }
    );
  }

  const succeeded: Array<{
    domain: string;
    payload: AtomCachePayload;
    warning?: string;
  }> = [];
  const failed: Failure[] = [];

  for (const item of normalised) {
    if (!item.domain || !isValidAsciiDomain(item.domain)) {
      failed.push({ domain: item.domain, message: "Invalid domain name", status: 400 });
      continue;
    }
    if (item.price === null) {
      failed.push({
        domain: item.domain,
        message: "Selling price must be greater than 0",
        status: 400,
      });
      continue;
    }

    try {
      const result = await callAtom<AtomMessageResponse>(auth.credentials, "GET", "/add-domain", {
        domain_type: item.listingType,
        domain_name: item.domain,
        price: item.price,
      });
      assertAtomSuccess(result);

      // `add-domain` returns only a message. Skip the per-item details call in
      // bulk mode to keep the batch fast; the next sync reconciles the real
      // status, category and listing type.
      succeeded.push({
        domain: item.domain,
        payload: fallbackAtomPayload(item.domain, item.price, item.listingType),
        warning: "Run Sync Atom to refresh the listing details.",
      });
    } catch (error) {
      failed.push({
        domain: item.domain,
        message: error instanceof Error ? error.message : "Could not add the domain on Atom",
        status: isAtomError(error) ? error.status : 500,
      });
    }
  }

  return NextResponse.json({ data: { succeeded, failed } });
}

import { NextRequest, NextResponse } from "next/server";
import { assertAtomSuccess, callAtom } from "@/lib/atom/client";
import { fallbackAtomPayload, mapAtomDomain, type AtomCachePayload } from "@/lib/atom/mappers";
import { toAsciiDomain, isValidAsciiDomain } from "@/lib/atom/names";
import { parseAtomListingType, validateAtomPrice } from "@/lib/atom/pricing";
import { atomErrorResponse, authenticateAtom, readJson } from "@/lib/atom/route-helpers";
import type { AtomApiDomain, AtomMessageResponse } from "@/types/atom";

interface InsertBody {
  domain?: string;
  price?: number | string;
  domainType?: string;
  confirmPremium?: boolean;
}

/**
 * Adds a listing to Atom.
 *
 * Atom's `add-domain` is a GET and returns only `{ message }`, so a follow-up
 * `domain-details` call is required to cache the real row. Premium listings
 * cost a coin and go to review, so they require an explicit confirmation.
 */
export async function POST(request: NextRequest) {
  const auth = await authenticateAtom();
  if (!auth.ok) return auth.response;

  const body = await readJson<InsertBody>(request);
  const domain = toAsciiDomain(String(body?.domain ?? ""));
  const price = validateAtomPrice(body?.price);
  const listingType = parseAtomListingType(body?.domainType);

  if (!domain || !isValidAsciiDomain(domain)) {
    return NextResponse.json({ error: "Enter a valid domain name" }, { status: 400 });
  }
  if (price === null) {
    return NextResponse.json({ error: "Selling price must be greater than 0" }, { status: 400 });
  }
  if (listingType === "premium" && body?.confirmPremium !== true) {
    return NextResponse.json(
      {
        error:
          "Premium listings cost 1 coin and cannot be removed through the API. Confirm the coin spend to continue.",
      },
      { status: 400 }
    );
  }

  try {
    const result = await callAtom<AtomMessageResponse>(auth.credentials, "GET", "/add-domain", {
      domain_type: listingType,
      domain_name: domain,
      price,
    });
    assertAtomSuccess(result);

    let payload: AtomCachePayload;
    let warning: string | undefined;

    try {
      const details = await callAtom<AtomApiDomain>(auth.credentials, "GET", "/domain-details", {
        domain_name: domain,
      });

      payload = details?.domain_name
        ? mapAtomDomain(details)
        : fallbackAtomPayload(domain, price, listingType);
    } catch {
      payload = fallbackAtomPayload(domain, price, listingType);
      warning = "Listing was submitted, but Atom details could not be loaded yet.";
    }

    return NextResponse.json({
      data: {
        domain,
        payload,
        message: result?.message,
        warning,
      },
    });
  } catch (error) {
    return atomErrorResponse(error);
  }
}

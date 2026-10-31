import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assertAtomSuccess, callAtom } from "@/lib/atom/client";
import { normalizeAtomListingType } from "@/lib/atom/mappers";
import { toAsciiDomain } from "@/lib/atom/names";
import { isAtomRemovable, parseAtomListingType } from "@/lib/atom/pricing";
import { atomErrorResponse, authenticateAtom, readJson } from "@/lib/atom/route-helpers";
import type {
  AtomApiDomain,
  AtomCredentials,
  AtomListingType,
  AtomMessageResponse,
} from "@/types/atom";

interface DeleteBody {
  domain?: string;
  listingType?: string;
}

const NOT_REMOVABLE =
  "Atom only allows API removal for Standard and Plus listings. Premium and Geo listings must be removed from the Atom dashboard (Premium requires a 30-day notice).";

/**
 * Reads the live listing type from Atom. This prevents a stale cache from
 * allowing a Premium/Geo listing to reach the removal endpoint.
 */
async function fetchLiveListingType(
  credentials: AtomCredentials,
  domain: string
): Promise<AtomListingType | null> {
  try {
    const details = await callAtom<AtomApiDomain>(credentials, "GET", "/domain-details", {
      domain_name: domain,
    });
    if (!details?.domain_name || !details.listing_type) return null;
    return normalizeAtomListingType(details.listing_type);
  } catch {
    return null;
  }
}

async function resolveCachedListingType(domain: string): Promise<AtomListingType | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("atom_listings")
    .select("listing_type")
    .ilike("domain_name", domain)
    .maybeSingle();

  const row = data as { listing_type: string | null } | null;
  return row?.listing_type ? parseAtomListingType(row.listing_type) : null;
}

async function handle(request: NextRequest) {
  const auth = await authenticateAtom();
  if (!auth.ok) return auth.response;

  const body = await readJson<DeleteBody>(request);
  const raw = body?.domain ?? request.nextUrl.searchParams.get("domain") ?? "";
  const domain = toAsciiDomain(raw);

  if (!domain) {
    return NextResponse.json({ error: "Missing domain" }, { status: 400 });
  }

  const liveType = await fetchLiveListingType(auth.credentials, domain);
  const suppliedType = body?.listingType ? parseAtomListingType(body.listingType) : null;
  const listingType = liveType ?? suppliedType ?? (await resolveCachedListingType(domain));

  if (listingType && !isAtomRemovable(listingType)) {
    return NextResponse.json({ error: NOT_REMOVABLE }, { status: 409 });
  }

  try {
    const result = await callAtom<AtomMessageResponse>(auth.credentials, "GET", "/remove-domain", {
      domain_name: domain,
    });
    assertAtomSuccess(result);

    return NextResponse.json({
      data: { domain, removed: true, message: result?.message },
    });
  } catch (error) {
    return atomErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}

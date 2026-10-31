import { NextRequest, NextResponse } from "next/server";
import { assertAtomSuccess, callAtom, isAtomError } from "@/lib/atom/client";
import { toAsciiDomain } from "@/lib/atom/names";
import { isAtomRemovable, parseAtomListingType } from "@/lib/atom/pricing";
import { authenticateAtom, readJson } from "@/lib/atom/route-helpers";
import type { AtomMessageResponse } from "@/types/atom";

interface BulkItem {
  domain?: string;
  listingType?: string;
}

interface BulkBody {
  items?: BulkItem[];
}

const NOT_REMOVABLE =
  "Atom only allows API removal for Standard and Plus listings. Premium and Geo listings must be removed from the Atom dashboard (Premium requires a 30-day notice).";

/** Bulk-removes Standard Atom listings. Premium/Geo are reported as skipped. */
export async function POST(request: NextRequest) {
  const auth = await authenticateAtom();
  if (!auth.ok) return auth.response;

  const body = await readJson<BulkBody>(request);
  const items = body?.items ?? [];

  if (items.length === 0) {
    return NextResponse.json({ error: "No domains supplied" }, { status: 400 });
  }
  if (items.length > 200) {
    return NextResponse.json({ error: "Remove at most 200 domains per batch" }, { status: 400 });
  }

  const succeeded: Array<{ domain: string }> = [];
  const failed: Array<{ domain: string; message: string; status: number }> = [];

  for (const raw of items) {
    const domain = toAsciiDomain(String(raw?.domain ?? ""));
    const listingType = raw?.listingType ? parseAtomListingType(raw.listingType) : null;

    if (!domain) {
      failed.push({ domain, message: "Invalid domain name", status: 400 });
      continue;
    }
    if (listingType && !isAtomRemovable(listingType)) {
      failed.push({ domain, message: NOT_REMOVABLE, status: 409 });
      continue;
    }

    try {
      const result = await callAtom<AtomMessageResponse>(
        auth.credentials,
        "GET",
        "/remove-domain",
        {
          domain_name: domain,
        }
      );
      assertAtomSuccess(result);
      succeeded.push({ domain });
    } catch (error) {
      failed.push({
        domain,
        message: error instanceof Error ? error.message : "Could not remove the Atom listing",
        status: isAtomError(error) ? error.status : 500,
      });
    }
  }

  return NextResponse.json({ data: { succeeded, failed } });
}

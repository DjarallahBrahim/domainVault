import { NextResponse } from "next/server";
import { callAtom } from "@/lib/atom/client";
import { mapAtomDomain } from "@/lib/atom/mappers";
import { atomErrorResponse, authenticateAtom } from "@/lib/atom/route-helpers";
import type { AtomApiDomain } from "@/types/atom";

const PAGE_SIZE = 100;
const MAX_PAGES = 500;

function asRows(response: unknown): AtomApiDomain[] {
  if (Array.isArray(response)) return response as AtomApiDomain[];
  const rows = (response as { data?: unknown } | null)?.data;
  return Array.isArray(rows) ? (rows as AtomApiDomain[]) : [];
}

export async function GET() {
  const auth = await authenticateAtom();
  if (!auth.ok) return auth.response;

  try {
    const listings: Array<{
      domain: string;
      payload: ReturnType<typeof mapAtomDomain>;
    }> = [];
    const seen = new Set<string>();

    for (let page = 1; page <= MAX_PAGES; page += 1) {
      const response = await callAtom<unknown>(auth.credentials, "GET", "/domains", {
        limit: PAGE_SIZE,
        page,
      });
      const rows = asRows(response);

      if (rows.length === 0) break;

      const before = listings.length;
      for (const row of rows) {
        const domain = String(row?.domain_name ?? "")
          .trim()
          .toLowerCase();
        if (!domain || seen.has(domain)) continue;
        seen.add(domain);
        listings.push({
          domain,
          payload: mapAtomDomain(row),
        });
      }

      // Stop when the provider repeats a page or returns nothing new.
      if (listings.length === before) break;
    }

    return NextResponse.json({
      data: { listings, total: listings.length },
    });
  } catch (error) {
    return atomErrorResponse(error);
  }
}

import { NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import { mapAfternicDomain } from "@/lib/afternic/mappers";
import { afternicErrorResponse, authenticateAfternic } from "@/lib/afternic/route-helpers";
import type { AfternicListResponse } from "@/types/afternic";

const PAGE_SIZE = 50;
const MAX_PAGES = 200;

async function fetchPage(
  credentials: { apiKey: string; apiSecret: string },
  offset: number
): Promise<AfternicListResponse> {
  const path = `/domains?limit=${PAGE_SIZE}&offset=${offset}&order=NAME_ASC&includes=fastTransferStatus`;
  try {
    return await callAfternic<AfternicListResponse>(credentials, "GET", path);
  } catch (error) {
    // `includes` is optional; some accounts/plans reject it. Retry without.
    if (isAfternicError(error) && error.status === 400) {
      return callAfternic<AfternicListResponse>(
        credentials,
        "GET",
        `/domains?limit=${PAGE_SIZE}&offset=${offset}&order=NAME_ASC`
      );
    }
    throw error;
  }
}

export async function GET() {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  try {
    const listings: Array<{
      domain: string;
      payload: ReturnType<typeof mapAfternicDomain>;
    }> = [];

    let offset = 0;

    for (let page = 0; page < MAX_PAGES; page += 1) {
      const response = await fetchPage(auth.credentials, offset);
      const domains = response?.domains ?? [];

      for (const domain of domains) {
        if (!domain?.name) continue;
        listings.push({
          domain: domain.name.toLowerCase(),
          payload: mapAfternicDomain(domain),
        });
      }

      const hasNext = Boolean(response?.pagination?.next);
      if (!hasNext || domains.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    return NextResponse.json({
      data: { listings, total: listings.length },
    });
  } catch (error) {
    return afternicErrorResponse(error);
  }
}

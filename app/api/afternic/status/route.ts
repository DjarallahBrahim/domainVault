import { NextRequest, NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import { mapAfternicDomain } from "@/lib/afternic/mappers";
import { toAsciiDomain } from "@/lib/afternic/names";
import { afternicErrorResponse, authenticateAfternic } from "@/lib/afternic/route-helpers";
import type { AfternicApiDomain } from "@/types/afternic";

export async function GET(request: NextRequest) {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  const raw = request.nextUrl.searchParams.get("domain");
  if (!raw) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  const domain = toAsciiDomain(raw);

  try {
    const listing = await callAfternic<AfternicApiDomain>(
      auth.credentials,
      "GET",
      `/domains/${encodeURIComponent(domain)}?includes=fastTransferStatus`
    );

    return NextResponse.json({
      data: {
        domain,
        listed: true,
        payload: mapAfternicDomain(listing),
      },
    });
  } catch (error) {
    if (isAfternicError(error) && error.status === 404) {
      return NextResponse.json({
        data: { domain, listed: false, payload: null },
      });
    }
    return afternicErrorResponse(error);
  }
}

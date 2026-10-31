import { NextRequest, NextResponse } from "next/server";
import { callAtom, isAtomError } from "@/lib/atom/client";
import { mapAtomDomain } from "@/lib/atom/mappers";
import { toAsciiDomain } from "@/lib/atom/names";
import { atomErrorResponse, authenticateAtom } from "@/lib/atom/route-helpers";
import type { AtomApiDomain } from "@/types/atom";

export async function GET(request: NextRequest) {
  const auth = await authenticateAtom();
  if (!auth.ok) return auth.response;

  const raw = request.nextUrl.searchParams.get("domain");
  if (!raw) {
    return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
  }

  const domain = toAsciiDomain(raw);

  try {
    const listing = await callAtom<AtomApiDomain>(auth.credentials, "GET", "/domain-details", {
      domain_name: domain,
    });

    // Atom sometimes returns a 200 with an empty/message-only body when the
    // domain is not in the seller portfolio.
    if (!listing?.domain_name) {
      return NextResponse.json({
        data: { domain, listed: false, payload: null },
      });
    }

    return NextResponse.json({
      data: {
        domain,
        listed: true,
        payload: mapAtomDomain(listing),
      },
    });
  } catch (error) {
    if (isAtomError(error) && error.status === 404) {
      return NextResponse.json({
        data: { domain, listed: false, payload: null },
      });
    }
    return atomErrorResponse(error);
  }
}

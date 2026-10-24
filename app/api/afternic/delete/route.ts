import { NextRequest, NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import { toAsciiDomain } from "@/lib/afternic/names";
import {
  afternicErrorResponse,
  authenticateAfternic,
  readJson,
} from "@/lib/afternic/route-helpers";

export async function DELETE(request: NextRequest) {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  const body = await readJson<{ domain?: string }>(request);
  if (!body?.domain) {
    return NextResponse.json({ error: "Missing required field: domain" }, { status: 400 });
  }

  const domain = toAsciiDomain(body.domain);

  try {
    await callAfternic(auth.credentials, "DELETE", `/domains/${encodeURIComponent(domain)}`);

    return NextResponse.json({ data: { success: true, domain } });
  } catch (error) {
    // Already removed from Afternic — treat as success so the cache is cleaned.
    if (isAfternicError(error) && error.status === 404) {
      return NextResponse.json({ data: { success: true, domain } });
    }

    // 422 on delete means the domain is on hold and cannot be removed.
    if (isAfternicError(error) && error.status === 422) {
      return NextResponse.json(
        {
          error:
            error.message ||
            "This domain is on hold and cannot be removed until the sale is resolved.",
          code: "ON_HOLD",
        },
        { status: 422 }
      );
    }
    return afternicErrorResponse(error);
  }
}

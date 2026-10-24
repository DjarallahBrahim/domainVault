import { NextRequest, NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import { mapAfternicDomain } from "@/lib/afternic/mappers";
import { toAsciiDomain } from "@/lib/afternic/names";
import { buildAfternicPayload } from "@/lib/afternic/pricing";
import { validateLanderOptions } from "@/lib/afternic/lander";
import {
  afternicErrorResponse,
  authenticateAfternic,
  readJson,
} from "@/lib/afternic/route-helpers";
import type { AfternicApiDomain, AfternicInsertRequest } from "@/types/afternic";

export async function POST(request: NextRequest) {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  const body = await readJson<AfternicInsertRequest>(request);
  if (!body?.domain) {
    return NextResponse.json({ error: "Missing required field: domain" }, { status: 400 });
  }
  if (body.buynow === undefined || body.buynow === null) {
    return NextResponse.json({ error: "Buy Now price is required" }, { status: 400 });
  }

  const domain = toAsciiDomain(body.domain);

  if ((body.intakeStyle ?? "BUYNOW") === "CUSTOM_LANDER") {
    const validation = validateLanderOptions({
      intakeStyle: "CUSTOM_LANDER",
      buynowUsd: body.buynow,
      minbidUsd: body.minbid ?? null,
      leasingEnabled: body.leasingEnabled ?? false,
      maxLeasePeriod: body.maxLeasePeriod ?? null,
      show: {
        buynow: body.showLanderBuynowOption ?? true,
        makeOffer: body.showLanderMakeOfferOption ?? false,
        lease: body.showLanderLeaseToOwnOption ?? false,
      },
    });

    if (!validation.ok) {
      return NextResponse.json(
        {
          error: validation.errors[0],
          fields: validation.errors.map((message) => ({
            message,
            path: "lander",
          })),
        },
        { status: 400 }
      );
    }
  }

  const payload = buildAfternicPayload({
    name: domain,
    buynow: body.buynow,
    minbid: body.minbid ?? null,
    floor: body.floor ?? null,
    displayName: body.displayName ?? null,
    intakeStyle: body.intakeStyle ?? "BUYNOW",
    leasingEnabled: body.leasingEnabled,
    maxLeasePeriod: body.maxLeasePeriod ?? null,
    showLanderLeaseToOwnOption: body.showLanderLeaseToOwnOption,
    showLanderBuynowOption: body.showLanderBuynowOption,
    showLanderMakeOfferOption: body.showLanderMakeOfferOption,
  });

  try {
    const created = await callAfternic<AfternicApiDomain>(
      auth.credentials,
      "POST",
      "/domains",
      payload
    );

    return NextResponse.json({
      data: {
        domain,
        alreadyExisted: false,
        payload: mapAfternicDomain(created),
      },
    });
  } catch (error) {
    // 409 = the domain is already listed. Treat as success and sync it.
    if (isAfternicError(error) && error.status === 409) {
      try {
        const existing = await callAfternic<AfternicApiDomain>(
          auth.credentials,
          "GET",
          `/domains/${encodeURIComponent(domain)}?includes=fastTransferStatus`
        );
        return NextResponse.json({
          data: {
            domain,
            alreadyExisted: true,
            payload: mapAfternicDomain(existing),
          },
        });
      } catch (syncError) {
        return afternicErrorResponse(syncError);
      }
    }
    return afternicErrorResponse(error);
  }
}

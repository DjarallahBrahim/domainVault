import { NextRequest, NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import { mapAfternicDomain } from "@/lib/afternic/mappers";
import { toAsciiDomain } from "@/lib/afternic/names";
import { buildAfternicPatch, fromMicro } from "@/lib/afternic/pricing";
import { validateLanderOptions } from "@/lib/afternic/lander";
import {
  afternicErrorResponse,
  authenticateAfternic,
  readJson,
} from "@/lib/afternic/route-helpers";
import type { AfternicApiDomain, AfternicEditRequest } from "@/types/afternic";

export async function PATCH(request: NextRequest) {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  const body = await readJson<AfternicEditRequest>(request);
  if (!body?.domain) {
    return NextResponse.json({ error: "Missing required field: domain" }, { status: 400 });
  }

  const domain = toAsciiDomain(body.domain);

  const hasShowFlags =
    body.showLanderBuynowOption !== undefined ||
    body.showLanderMakeOfferOption !== undefined ||
    body.showLanderLeaseToOwnOption !== undefined;

  // Sales-method flags only make sense together with valid prices/lease
  // settings. Merge the patch onto the current listing before validating.
  if (hasShowFlags) {
    try {
      const current = await callAfternic<AfternicApiDomain>(
        auth.credentials,
        "GET",
        `/domains/${encodeURIComponent(domain)}?includes=fastTransferStatus`
      );

      const validation = validateLanderOptions({
        intakeStyle: "CUSTOM_LANDER",
        buynowUsd:
          body.buynow !== undefined && body.buynow !== null
            ? body.buynow
            : fromMicro(current.buynowPrice),
        minbidUsd:
          body.minbid !== undefined && body.minbid !== null
            ? body.minbid
            : fromMicro(current.minbidPrice),
        leasingEnabled:
          body.showLanderLeaseToOwnOption === true
            ? true
            : body.showLanderLeaseToOwnOption === false
              ? false
              : (body.leasingEnabled ?? current.leasingEnabled ?? false),
        maxLeasePeriod: body.maxLeasePeriod ?? current.maxLeasePeriod ?? 2,
        show: {
          buynow: body.showLanderBuynowOption ?? current.showLanderBuynowOption ?? true,
          makeOffer: body.showLanderMakeOfferOption ?? current.showLanderMakeOfferOption ?? false,
          lease: body.showLanderLeaseToOwnOption ?? current.showLanderLeaseToOwnOption ?? false,
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
    } catch (error) {
      return afternicErrorResponse(error);
    }
  }

  const payload = buildAfternicPatch({
    buynow: body.buynow ?? undefined,
    minbid: body.minbid ?? undefined,
    floor: body.floor ?? undefined,
    displayName: body.displayName ?? undefined,
    intakeStyle: body.intakeStyle ?? undefined,
    landingPage: body.landingPage ?? undefined,
    hidden: body.hidden ?? undefined,
    leasingEnabled: body.leasingEnabled ?? undefined,
    maxLeasePeriod: body.maxLeasePeriod ?? undefined,
    showLanderLeaseToOwnOption: body.showLanderLeaseToOwnOption ?? undefined,
    showLanderBuynowOption: body.showLanderBuynowOption ?? undefined,
    showLanderMakeOfferOption: body.showLanderMakeOfferOption ?? undefined,
  });

  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "No changes supplied" }, { status: 400 });
  }

  try {
    const updated = await callAfternic<AfternicApiDomain | undefined>(
      auth.credentials,
      "PATCH",
      `/domains/${encodeURIComponent(domain)}?resource=true`,
      payload
    );

    // `204 No Content` (or a body-less response) → fetch the fresh values.
    if (!updated || !updated.name) {
      const fresh = await callAfternic<AfternicApiDomain>(
        auth.credentials,
        "GET",
        `/domains/${encodeURIComponent(domain)}?includes=fastTransferStatus`
      );
      return NextResponse.json({
        data: { domain, payload: mapAfternicDomain(fresh) },
      });
    }

    return NextResponse.json({
      data: { domain, payload: mapAfternicDomain(updated) },
    });
  } catch (error) {
    if (isAfternicError(error) && error.status === 404) {
      return NextResponse.json(
        { error: "This domain is not listed on Afternic", code: "NOT_FOUND" },
        { status: 404 }
      );
    }
    return afternicErrorResponse(error);
  }
}

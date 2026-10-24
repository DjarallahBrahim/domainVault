import { NextRequest, NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import { mapBulkResult } from "@/lib/afternic/mappers";
import { toAsciiDomain } from "@/lib/afternic/names";
import { buildAfternicPayload } from "@/lib/afternic/pricing";
import {
  afternicErrorResponse,
  authenticateAfternic,
  readJson,
} from "@/lib/afternic/route-helpers";
import type { AfternicBulkResult, AfternicIntakeStyle } from "@/types/afternic";

const CHUNK_SIZE = 500;

interface BulkItem {
  domain: string;
  buynow?: number | null;
  minbid?: number | null;
  floor?: number | null;
  displayName?: string | null;
  intakeStyle?: AfternicIntakeStyle;
  leasingEnabled?: boolean;
  maxLeasePeriod?: number | null;
}

interface BulkBody {
  items?: BulkItem[];
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  const body = await readJson<BulkBody>(request);
  const items = (body?.items ?? []).filter(
    (item) => item?.domain && item.buynow !== null && item.buynow !== undefined
  );

  if (items.length === 0) {
    return NextResponse.json(
      { error: "No domains with a Buy Now price were supplied" },
      { status: 400 }
    );
  }

  try {
    const succeeded: Array<{ domain: string; payload: unknown }> = [];
    const failed: Array<{ domain: string; code: number; message: string }> = [];

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      const domains = chunk.map((item) =>
        buildAfternicPayload({
          name: toAsciiDomain(item.domain),
          buynow: item.buynow ?? null,
          minbid: item.minbid ?? null,
          floor: item.floor ?? null,
          displayName: item.displayName ?? null,
          intakeStyle: item.intakeStyle ?? "BUYNOW",
          leasingEnabled: item.leasingEnabled,
          maxLeasePeriod: item.maxLeasePeriod ?? null,
        })
      );

      try {
        const result = await callAfternic<AfternicBulkResult>(
          auth.credentials,
          "POST",
          "/domains/$each/upsert",
          { domains }
        );
        const mapped = mapBulkResult(result ?? {});
        succeeded.push(...mapped.succeeded);
        failed.push(...mapped.failed);
      } catch (error) {
        const message = isAfternicError(error) ? error.message : "Bulk upsert failed";
        const code = isAfternicError(error) ? error.status : 500;
        for (const item of chunk) {
          failed.push({
            domain: toAsciiDomain(item.domain),
            code,
            message,
          });
        }
      }
    }

    return NextResponse.json({ data: { succeeded, failed } });
  } catch (error) {
    return afternicErrorResponse(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import { toAsciiDomain } from "@/lib/afternic/names";
import {
  afternicErrorResponse,
  authenticateAfternic,
  readJson,
} from "@/lib/afternic/route-helpers";

const CHUNK_SIZE = 500;

interface BulkDeleteResultItem {
  code: number;
  error?: { code?: string; message?: string };
}

type BulkDeleteResult = Record<string, BulkDeleteResultItem>;

export async function POST(request: NextRequest) {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  const body = await readJson<{ domains?: string[] }>(request);
  const domains = Array.from(new Set((body?.domains ?? []).map(toAsciiDomain).filter(Boolean)));

  if (domains.length === 0) {
    return NextResponse.json({ error: "No domains supplied" }, { status: 400 });
  }

  try {
    const succeeded: string[] = [];
    const failed: Array<{ domain: string; code: number; message: string }> = [];

    for (let i = 0; i < domains.length; i += CHUNK_SIZE) {
      const chunk = domains.slice(i, i + CHUNK_SIZE);

      try {
        const result = await callAfternic<BulkDeleteResult>(
          auth.credentials,
          "POST",
          "/domains/$each/delete",
          { names: chunk }
        );

        for (const [domain, item] of Object.entries(result ?? {})) {
          const code = Number(item?.code ?? 0);
          if (code >= 200 && code < 300) {
            succeeded.push(domain.toLowerCase());
          } else {
            failed.push({
              domain: domain.toLowerCase(),
              code: code || 500,
              message: item?.error?.message ?? "This domain cannot be removed from Afternic",
            });
          }
        }
      } catch (error) {
        const message = isAfternicError(error) ? error.message : "Bulk delete failed";
        const code = isAfternicError(error) ? error.status : 500;
        for (const domain of chunk) {
          failed.push({ domain, code, message });
        }
      }
    }

    return NextResponse.json({ data: { succeeded, failed } });
  } catch (error) {
    return afternicErrorResponse(error);
  }
}

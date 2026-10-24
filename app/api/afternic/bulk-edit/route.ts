import { NextRequest, NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import { mapAfternicDomain } from "@/lib/afternic/mappers";
import { toAsciiDomain } from "@/lib/afternic/names";
import { buildAfternicPatch } from "@/lib/afternic/pricing";
import { validateLanderPatch } from "@/lib/afternic/lander";
import {
  afternicErrorResponse,
  authenticateAfternic,
  readJson,
} from "@/lib/afternic/route-helpers";
import type { AfternicApiDomain, AfternicPatchChanges } from "@/types/afternic";

const CONCURRENCY = 5;

interface BulkEditItem {
  domain: string;
  changes: AfternicPatchChanges;
}

interface BulkEditBody {
  items?: BulkEditItem[];
  domains?: string[];
  changes?: AfternicPatchChanges;
}

interface EditOutcome {
  domain: string;
  ok: boolean;
  payload?: ReturnType<typeof mapAfternicDomain>;
  code?: number;
  message?: string;
}

function normaliseItems(body: BulkEditBody | null): BulkEditItem[] {
  if (body?.items?.length) {
    return body.items
      .filter((item) => item?.domain && item?.changes)
      .map((item) => ({
        domain: toAsciiDomain(item.domain),
        changes: item.changes,
      }));
  }

  if (body?.domains?.length && body?.changes) {
    return body.domains
      .map(toAsciiDomain)
      .filter(Boolean)
      .map((domain) => ({ domain, changes: body.changes as AfternicPatchChanges }));
  }

  return [];
}

async function editOne(
  credentials: { apiKey: string; apiSecret: string },
  item: BulkEditItem
): Promise<EditOutcome> {
  const landerErrors = validateLanderPatch(item.changes);

  if (landerErrors.length > 0) {
    return {
      domain: item.domain,
      ok: false,
      code: 400,
      message: landerErrors[0],
    };
  }

  const payload = buildAfternicPatch(item.changes);

  if (Object.keys(payload).length === 0) {
    return {
      domain: item.domain,
      ok: false,
      code: 400,
      message: "No changes supplied",
    };
  }

  try {
    const updated = await callAfternic<AfternicApiDomain | undefined>(
      credentials,
      "PATCH",
      `/domains/${encodeURIComponent(item.domain)}?resource=true`,
      payload
    );

    if (updated && updated.name) {
      return {
        domain: item.domain,
        ok: true,
        payload: mapAfternicDomain(updated),
      };
    }

    const fresh = await callAfternic<AfternicApiDomain>(
      credentials,
      "GET",
      `/domains/${encodeURIComponent(item.domain)}?includes=fastTransferStatus`
    );

    return {
      domain: item.domain,
      ok: true,
      payload: mapAfternicDomain(fresh),
    };
  } catch (error) {
    if (isAfternicError(error)) {
      return {
        domain: item.domain,
        ok: false,
        code: error.status,
        message: error.message,
      };
    }
    return {
      domain: item.domain,
      ok: false,
      code: 500,
      message: "Could not reach Afternic. Try again.",
    };
  }
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAfternic();
  if (!auth.ok) return auth.response;

  const body = await readJson<BulkEditBody>(request);
  const items = normaliseItems(body);

  if (items.length === 0) {
    return NextResponse.json({ error: "No domains or changes supplied" }, { status: 400 });
  }

  try {
    const succeeded: Array<{
      domain: string;
      payload: ReturnType<typeof mapAfternicDomain>;
    }> = [];
    const failed: Array<{ domain: string; code: number; message: string }> = [];

    for (let i = 0; i < items.length; i += CONCURRENCY) {
      const group = items.slice(i, i + CONCURRENCY);
      const results = await Promise.all(group.map((item) => editOne(auth.credentials, item)));

      for (const result of results) {
        if (result.ok && result.payload) {
          succeeded.push({ domain: result.domain, payload: result.payload });
        } else {
          failed.push({
            domain: result.domain,
            code: result.code ?? 500,
            message: result.message ?? "Update failed",
          });
        }
      }
    }

    return NextResponse.json({ data: { succeeded, failed } });
  } catch (error) {
    return afternicErrorResponse(error);
  }
}

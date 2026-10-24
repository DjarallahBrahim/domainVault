import { NextRequest, NextResponse } from "next/server";
import { callAfternic, isAfternicError } from "@/lib/afternic/client";
import {
  afternicErrorResponse,
  authenticateAfternic,
  readJson,
} from "@/lib/afternic/route-helpers";
import type { AfternicCredentials } from "@/types/afternic";

interface CheckBody {
  apiKey?: string;
  apiSecret?: string;
}

/**
 * Resolves which credentials to test.
 *
 * Precedence:
 * 1. Both values from the form (the user may not have saved yet).
 * 2. API key from the form + the saved secret (changing only the key).
 * 3. Fully saved credentials.
 */
async function resolveCredentials(
  request?: NextRequest
): Promise<{ ok: true; credentials: AfternicCredentials } | { ok: false; response: NextResponse }> {
  const body = request ? await readJson<CheckBody>(request) : null;
  const formKey = body?.apiKey?.trim();
  const formSecret = body?.apiSecret?.trim();

  if (formKey && formSecret) {
    return { ok: true, credentials: { apiKey: formKey, apiSecret: formSecret } };
  }

  const auth = await authenticateAfternic();
  if (!auth.ok) {
    if (formKey || formSecret) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Enter both the API Key and API Secret to test" },
          { status: 400 }
        ),
      };
    }
    return auth;
  }

  if (formKey) {
    return {
      ok: true,
      credentials: {
        apiKey: formKey,
        apiSecret: auth.credentials.apiSecret,
      },
    };
  }

  return { ok: true, credentials: auth.credentials };
}

async function handle(request?: NextRequest) {
  const resolved = await resolveCredentials(request);
  if (!resolved.ok) return resolved.response;

  try {
    await callAfternic(resolved.credentials, "GET", "/domains?limit=1");
    return NextResponse.json({ data: { valid: true } });
  } catch (error) {
    if (isAfternicError(error) && (error.status === 401 || error.status === 403)) {
      return NextResponse.json({ data: { valid: false } });
    }
    return afternicErrorResponse(error);
  }
}

/** Tests credentials supplied in the request body (falling back to saved ones). */
export async function POST(request: NextRequest) {
  return handle(request);
}

/** Tests the saved credentials. Kept for compatibility. */
export async function GET() {
  return handle();
}

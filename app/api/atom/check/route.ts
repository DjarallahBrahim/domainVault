import { NextRequest, NextResponse } from "next/server";
import { callAtom, isAtomError } from "@/lib/atom/client";
import { atomErrorResponse, authenticateAtom, readJson } from "@/lib/atom/route-helpers";
import type { AtomCredentials } from "@/types/atom";

interface CheckBody {
  apiToken?: string;
  userId?: number | string;
}

function parseUserId(value: unknown): number | null {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : null;
}

/**
 * Resolves which credentials to test.
 *
 * Precedence:
 * 1. Both values from the form (the user may not have saved yet).
 * 2. One form value + the matching saved value.
 * 3. Fully saved credentials.
 */
async function resolveCredentials(
  request?: NextRequest
): Promise<{ ok: true; credentials: AtomCredentials } | { ok: false; response: NextResponse }> {
  const body = request ? await readJson<CheckBody>(request) : null;
  const formToken = body?.apiToken?.trim();
  const formUserId = body?.userId !== undefined ? parseUserId(body.userId) : null;
  const suppliedAnything = Boolean(formToken) || body?.userId !== undefined;

  if (formToken && formUserId) {
    return { ok: true, credentials: { apiToken: formToken, userId: formUserId } };
  }

  const auth = await authenticateAtom();
  if (!auth.ok) {
    if (suppliedAnything) {
      return {
        ok: false,
        response: NextResponse.json(
          { error: "Enter both the API Token and User ID to test" },
          { status: 400 }
        ),
      };
    }
    return auth;
  }

  return {
    ok: true,
    credentials: {
      apiToken: formToken || auth.credentials.apiToken,
      userId: formUserId ?? auth.credentials.userId,
    },
  };
}

async function handle(request?: NextRequest) {
  const resolved = await resolveCredentials(request);
  if (!resolved.ok) return resolved.response;

  try {
    await callAtom(resolved.credentials, "GET", "/domains", { limit: 1 });
    return NextResponse.json({ data: { valid: true } });
  } catch (error) {
    if (isAtomError(error) && (error.status === 401 || error.status === 403)) {
      return NextResponse.json({ data: { valid: false } });
    }
    return atomErrorResponse(error);
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

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchUserSettings } from "@/lib/supabase/queries/settings";
import { isAfternicError } from "@/lib/afternic/client";
import type { AfternicCredentials } from "@/types/afternic";

export type AfternicAuth =
  | { ok: true; credentials: AfternicCredentials; userId: string }
  | { ok: false; response: NextResponse };

/** Authenticates the caller and resolves their Afternic credentials. */
export async function authenticateAfternic(): Promise<AfternicAuth> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Not authenticated" }, { status: 401 }),
    };
  }

  const settings = await fetchUserSettings();
  if (!settings?.afternic_api_key || !settings?.afternic_api_secret) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Add Afternic credentials in Settings first" },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true,
    userId: user.id,
    credentials: {
      apiKey: settings.afternic_api_key,
      apiSecret: settings.afternic_api_secret,
    },
  };
}

/** Converts thrown errors into the JSON error envelope the UI expects. */
export function afternicErrorResponse(error: unknown): NextResponse {
  if (isAfternicError(error)) {
    const status =
      error.status >= 400 && error.status <= 599 ? error.status : error.status === 0 ? 500 : 500;

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
        fields: error.fields,
      },
      { status }
    );
  }

  const message = error instanceof Error ? error.message : "Could not reach Afternic. Try again.";

  return NextResponse.json({ error: message }, { status: 500 });
}

/** Reads a JSON body defensively. */
export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

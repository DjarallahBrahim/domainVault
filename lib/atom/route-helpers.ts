import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fetchUserSettings } from "@/lib/supabase/queries/settings";
import { isAtomError } from "@/lib/atom/client";
import type { AtomCredentials } from "@/types/atom";

export type AtomAuth =
  | { ok: true; credentials: AtomCredentials; userId: string }
  | { ok: false; response: NextResponse };

/** Authenticates the caller and resolves their Atom credentials. */
export async function authenticateAtom(): Promise<AtomAuth> {
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
  if (!settings?.atom_api_token || !settings?.atom_user_id) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Add Atom credentials in Settings first" },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true,
    userId: user.id,
    credentials: {
      apiToken: settings.atom_api_token,
      userId: Number(settings.atom_user_id),
    },
  };
}

/** Converts thrown errors into the JSON error envelope the UI expects. */
export function atomErrorResponse(error: unknown): NextResponse {
  if (isAtomError(error)) {
    const status = error.status >= 400 && error.status <= 599 ? error.status : 500;

    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        details: error.details,
      },
      { status }
    );
  }

  const message = error instanceof Error ? error.message : "Could not reach Atom. Try again.";

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

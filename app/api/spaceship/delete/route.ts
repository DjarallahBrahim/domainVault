import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { spaceshipFetch } from "@/lib/spaceship/client";
import { fetchUserSettings } from "@/lib/supabase/queries/settings";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { domain } = body;

    if (!domain) {
      return NextResponse.json({ error: "Missing required field: domain" }, { status: 400 });
    }

    const settings = await fetchUserSettings();
    if (!settings?.spaceship_api_key || !settings?.spaceship_api_secret) {
      return NextResponse.json(
        { error: "Spaceship credentials not configured" },
        { status: 401 }
      );
    }

    await spaceshipFetch(
      `/sellerhub/domains/${encodeURIComponent(domain)}`,
      settings.spaceship_api_key,
      settings.spaceship_api_secret,
      { method: "DELETE" }
    );

    return NextResponse.json({ data: { success: true, domain } });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Could not reach Spaceship. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

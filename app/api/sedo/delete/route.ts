import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callSedo } from "@/lib/sedo/client";
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
      return NextResponse.json(
        { error: "Missing required field: domain" },
        { status: 400 }
      );
    }

    const settings = await fetchUserSettings();
    if (
      !settings?.sedo_partner_id ||
      !settings?.sedo_signkey ||
      !settings?.sedo_username ||
      !settings?.sedo_password
    ) {
      return NextResponse.json(
        { error: "Sedo credentials not configured" },
        { status: 401 }
      );
    }

    await callSedo("DomainDelete", {
      partnerid: settings.sedo_partner_id,
      signkey: settings.sedo_signkey,
      username: settings.sedo_username,
      password: settings.sedo_password,
      "domains[0]": domain,
    });

    return NextResponse.json({ data: { success: true, domain } });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Could not reach Sedo. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

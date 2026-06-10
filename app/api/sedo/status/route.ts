import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callSedo } from "@/lib/sedo/client";
import { fetchUserSettings } from "@/lib/supabase/queries/settings";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
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

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
    }

    const items = await callSedo("DomainStatus", {
      partnerid: settings.sedo_partner_id,
      signkey: settings.sedo_signkey,
      username: settings.sedo_username,
      password: settings.sedo_password,
      "domainlist[0]": domain,
    });

    if (items.length === 0) {
      return NextResponse.json({
        data: { domain, listed: false, price: null, currency: null },
      });
    }

    const item = items[0] as {
      domain?: string;
      forsale?: string | boolean;
      price?: string | number;
      currency?: string | number;
      domainstatus?: string | number;
    };

    const isListed =
      (item.forsale === "true" || item.forsale === true) &&
      (item.domainstatus === "1" || item.domainstatus === 1);

    return NextResponse.json({
      data: {
        domain: item.domain ?? domain,
        listed: isListed,
        price: isListed ? Number(item.price) || 0 : null,
        currency: isListed ? Number(item.currency) || 1 : null,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Could not reach Sedo. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

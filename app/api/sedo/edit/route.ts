import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callSedo } from "@/lib/sedo/client";
import { computeSedoPricing } from "@/lib/sedo/pricing";
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
    const { domain, price, minprice, fixedprice } = body;

    if (!domain) {
      return NextResponse.json(
        { error: "Missing required field: domain" },
        { status: 400 }
      );
    }
    if (price === undefined || price === null) {
      return NextResponse.json(
        { error: "Missing required field: price" },
        { status: 400 }
      );
    }
    if (minprice === undefined || minprice === null) {
      return NextResponse.json(
        { error: "Missing required field: minprice" },
        { status: 400 }
      );
    }
    if (fixedprice === undefined || fixedprice === null) {
      return NextResponse.json(
        { error: "Missing required field: fixedprice" },
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

    const pricing = computeSedoPricing(Number(price), Number(minprice), fixedprice as 0 | 1);

    await callSedo("DomainEdit", {
      partnerid: settings.sedo_partner_id,
      signkey: settings.sedo_signkey,
      username: settings.sedo_username,
      password: settings.sedo_password,
      "domainentry[0][domain]": domain,
      "domainentry[0][forsale]": pricing.forsale,
      "domainentry[0][price]": pricing.price,
      "domainentry[0][minprice]": pricing.minprice,
      "domainentry[0][fixedprice]": pricing.fixedprice,
      "domainentry[0][currency]": pricing.currency,
    });

    return NextResponse.json({ data: { success: true, domain } });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Could not reach Sedo. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

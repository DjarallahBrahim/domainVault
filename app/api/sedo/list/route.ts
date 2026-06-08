import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callSedo } from "@/lib/sedo/client";
import { fetchUserSettings } from "@/lib/supabase/queries/settings";

export async function GET() {
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

    const credentials = {
      partnerid: settings.sedo_partner_id,
      signkey: settings.sedo_signkey,
      username: settings.sedo_username,
      password: settings.sedo_password,
    };

    const allListings: Record<string, string | number>[] = [];
    let startfrom = 0;
    const pageSize = 100;

    while (true) {
      try {
        const items = await callSedo("DomainList", {
          ...credentials,
          startfrom,
        });

        if (items.length === 0) break;

        allListings.push(...items);
        startfrom += pageSize;
      } catch (err: unknown) {
        const faultstring = (err as { faultstring?: string }).faultstring;
        if (faultstring && /no data|no domains|no listings/i.test(faultstring)) {
          break;
        }
        throw err;
      }
    }

    return NextResponse.json({
      data: {
        listings: allListings,
        total: allListings.length,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Could not reach Sedo. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

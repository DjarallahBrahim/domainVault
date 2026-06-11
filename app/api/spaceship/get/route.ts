import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { spaceshipFetch } from "@/lib/spaceship/client";
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
    if (!settings?.spaceship_api_key || !settings?.spaceship_api_secret) {
      return NextResponse.json(
        { error: "Spaceship credentials not configured" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Missing domain parameter" }, { status: 400 });
    }

    try {
      const raw = await spaceshipFetch<Record<string, unknown>>(
        `/sellerhub/domains/${encodeURIComponent(domain)}`,
        settings.spaceship_api_key,
        settings.spaceship_api_secret
      );

      const listing = raw ?? {};
      const binPrice = listing.binPrice as Record<string, unknown> | undefined;
      const minPrice = listing.minPrice as Record<string, unknown> | undefined;
      const price = Number(binPrice?.amount ?? 0);
      const minprice = Number(minPrice?.amount ?? 0);
      const currency = String(binPrice?.currency ?? "USD");
      const spaceshipId = String(listing.name ?? "");

      return NextResponse.json({
        data: {
          domain: String(listing.name ?? domain),
          listed: listing.status === "onSale",
          price,
          minprice,
          currency,
          spaceshipId,
        },
      });
    } catch (err) {
      if (
        (err as Error).message?.includes("404") ||
        (err as Error).message?.includes("not found")
      ) {
        return NextResponse.json({
          data: { domain, listed: false, price: null, currency: null },
        });
      }
      throw err;
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Could not reach Spaceship. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { spaceshipFetch } from "@/lib/spaceship/client";
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
    if (!settings?.spaceship_api_key || !settings?.spaceship_api_secret) {
      return NextResponse.json(
        { error: "Spaceship credentials not configured" },
        { status: 401 }
      );
    }

    const allListings: Array<{
      domain: string;
      id: string;
      price: number;
      minprice: number;
      currency: string;
    }> = [];

    let skip = 0;
    const take = 100;

    while (true) {
      const data = await spaceshipFetch<{
        items?: Array<Record<string, unknown>>;
      }>(
        `/sellerhub/domains?take=${take}&skip=${skip}`,
        settings.spaceship_api_key,
        settings.spaceship_api_secret
      );

      const items = data?.items ?? [];
      if (items.length === 0) break;

      for (const item of items) {
        const binPrice = item.binPrice as Record<string, unknown> | undefined;
        const minPrice = item.minPrice as Record<string, unknown> | undefined;
        allListings.push({
          domain: String(item.name ?? ""),
          id: String(item.name ?? ""),
          price: Number(binPrice?.amount ?? 0),
          minprice: Number(minPrice?.amount ?? 0),
          currency: String(binPrice?.currency ?? "USD"),
        });
      }

      skip += take;
    }

    return NextResponse.json({
      data: {
        listings: allListings,
        total: allListings.length,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Could not reach Spaceship. Try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

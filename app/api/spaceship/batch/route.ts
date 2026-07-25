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

    const settings = await fetchUserSettings();
    if (!settings?.spaceship_api_key || !settings?.spaceship_api_secret) {
      return NextResponse.json(
        { error: "Spaceship credentials not configured" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { price, minprice, domainIds } = body as {
      price: number;
      minprice?: number;
      domainIds: string[];
    };

    if (!domainIds?.length) {
      return NextResponse.json({ error: "No domains selected" }, { status: 400 });
    }

    const { data: allDomains } = await supabase
      .from("domains")
      .select("id, domain")
      .in("id", domainIds);

    const domains = (allDomains ?? []) as unknown as Array<{ id: string; domain: string }>;

    const errors: string[] = [];
    let successCount = 0;

    for (const d of domains) {
      try {
        await spaceshipFetch(
          `/sellerhub/domains/${encodeURIComponent(d.domain)}`,
          settings.spaceship_api_key,
          settings.spaceship_api_secret,
          {
            method: "PATCH",
            body: JSON.stringify({
              binPrice: { amount: String(price), currency: "USD" },
              ...(minprice ? { minPrice: { amount: String(minprice), currency: "USD" } } : {}),
              binPriceEnabled: true,
              minPriceEnabled: !!minprice,
            }),
          }
        );
        successCount++;
      } catch (err) {
        errors.push(`${d.domain}: ${err instanceof Error ? err.message : "Failed"}`);
      }
    }

    return NextResponse.json({
      data: { updated: successCount, errors },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not reach Spaceship. Try again." },
      { status: 500 }
    );
  }
}

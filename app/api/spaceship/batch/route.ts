import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { spaceshipFetch } from "@/lib/spaceship/client";
import { fetchUserSettings } from "@/lib/supabase/queries/settings";

interface BatchItem {
  domainId: string;
  price: number;
  minprice: number;
}

interface PricedItem extends BatchItem {
  domain: string;
}

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
      return NextResponse.json({ error: "Spaceship credentials not configured" }, { status: 401 });
    }

    const body = await request.json();

    // New shape: per-domain prices. Legacy shape (single price + domainIds)
    // is accepted so older clients keep working.
    const items: BatchItem[] = Array.isArray(body.items)
      ? body.items.map((item: Record<string, unknown>) => ({
          domainId: String(item.domainId ?? ""),
          price: Number(item.price) || 0,
          minprice: Number(item.minprice) || 0,
        }))
      : ((body.domainIds ?? []) as string[]).map((domainId) => ({
          domainId,
          price: Number(body.price) || 0,
          minprice: Number(body.minprice) || 0,
        }));

    const validItems = items.filter((item) => item.domainId && item.price > 0);
    if (validItems.length === 0) {
      return NextResponse.json(
        { error: "No domains with a valid price were selected" },
        { status: 400 }
      );
    }

    const domainIds = validItems.map((item) => item.domainId);

    const { data: allDomains } = await supabase
      .from("domains")
      .select("id, domain")
      .eq("user_id", user.id)
      .in("id", domainIds);

    const domainNameById = new Map(
      ((allDomains ?? []) as unknown as Array<{ id: string; domain: string }>).map((row) => [
        row.id,
        row.domain,
      ])
    );

    const pricedItems: PricedItem[] = validItems.flatMap((item) => {
      const domain = domainNameById.get(item.domainId);
      return domain
        ? [
            {
              ...item,
              domain,
              minprice: item.minprice > 0 ? Math.min(item.minprice, item.price) : 0,
            },
          ]
        : [];
    });

    const errors: string[] = [];
    let successCount = 0;

    for (const item of pricedItems) {
      try {
        await spaceshipFetch(
          `/sellerhub/domains/${encodeURIComponent(item.domain)}`,
          settings.spaceship_api_key,
          settings.spaceship_api_secret,
          {
            method: "PATCH",
            body: JSON.stringify({
              binPrice: { amount: String(item.price), currency: "USD" },
              ...(item.minprice
                ? { minPrice: { amount: String(item.minprice), currency: "USD" } }
                : {}),
              binPriceEnabled: true,
              minPriceEnabled: item.minprice > 0,
            }),
          }
        );
        successCount += 1;
      } catch (err) {
        errors.push(`${item.domain}: ${err instanceof Error ? err.message : "Failed"}`);
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

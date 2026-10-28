import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callSedo } from "@/lib/sedo/client";
import { computeSedoPricing } from "@/lib/sedo/pricing";
import { fetchUserSettings } from "@/lib/supabase/queries/settings";

interface BatchItem {
  domainId: string;
  price: number;
  minprice: number;
  fixedprice: 0 | 1;
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
    if (
      !settings?.sedo_partner_id ||
      !settings?.sedo_signkey ||
      !settings?.sedo_username ||
      !settings?.sedo_password
    ) {
      return NextResponse.json({ error: "Sedo credentials not configured" }, { status: 401 });
    }

    const body = await request.json();

    // New shape: per-domain prices. Legacy shape (single price + domainIds)
    // is accepted so older clients keep working.
    const items: BatchItem[] = Array.isArray(body.items)
      ? body.items.map((item: Record<string, unknown>) => ({
          domainId: String(item.domainId ?? ""),
          price: Number(item.price) || 0,
          minprice: Number(item.minprice) || 0,
          fixedprice: item.fixedprice === 0 ? 0 : 1,
        }))
      : ((body.domainIds ?? []) as string[]).map((domainId) => ({
          domainId,
          price: Number(body.price) || 0,
          minprice: Number(body.minprice) || 0,
          fixedprice: body.fixedprice === 0 ? 0 : 1,
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
              // Sedo requires a minprice. When the caller omits it, use the
              // asking price (matches the single-domain fixed-price default).
              minprice: item.minprice > 0 ? Math.min(item.minprice, item.price) : item.price,
            },
          ]
        : [];
    });

    const { data: existingRows } = await supabase
      .from("sedo_listings")
      .select("domain_id")
      .in("domain_id", domainIds);

    const existingIds = new Set(
      ((existingRows ?? []) as unknown as Array<{ domain_id: string }>).map((row) => row.domain_id)
    );

    const toInsert = pricedItems.filter((item) => !existingIds.has(item.domainId));
    const toEdit = pricedItems.filter((item) => existingIds.has(item.domainId));

    const credentials = {
      partnerid: settings.sedo_partner_id,
      signkey: settings.sedo_signkey,
      username: settings.sedo_username,
      password: settings.sedo_password,
    };

    const errors: string[] = [];

    const addParams = (
      params: Record<string, string | number>,
      item: PricedItem,
      index: number
    ) => {
      const pricing = computeSedoPricing(item.price, item.minprice, item.fixedprice);
      params[`domainentry[${index}][domain]`] = item.domain;
      params[`domainentry[${index}][forsale]`] = pricing.forsale;
      params[`domainentry[${index}][price]`] = pricing.price;
      params[`domainentry[${index}][minprice]`] = pricing.minprice;
      params[`domainentry[${index}][fixedprice]`] = pricing.fixedprice;
      params[`domainentry[${index}][currency]`] = pricing.currency;
    };

    if (toInsert.length > 0) {
      try {
        const params: Record<string, string | number> = { ...credentials };
        toInsert.forEach((item, index) => addParams(params, item, index));

        const results = await callSedo("DomainInsert", params as never);

        for (const r of results) {
          if (String(r.status) !== "ok") {
            errors.push(`${r.domain}: ${r.message}`);
          }
        }
      } catch (err) {
        errors.push(`Insert failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    if (toEdit.length > 0) {
      try {
        const params: Record<string, string | number> = { ...credentials };
        toEdit.forEach((item, index) => addParams(params, item, index));

        const results = await callSedo("DomainEdit", params as never);

        for (const r of results) {
          if (String(r.status) !== "ok") {
            errors.push(`${r.domain}: ${r.message}`);
          }
        }
      } catch (err) {
        errors.push(`Edit failed: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    return NextResponse.json({
      data: {
        inserted: toInsert.length,
        updated: toEdit.length,
        errors,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not reach Sedo. Try again." },
      { status: 500 }
    );
  }
}

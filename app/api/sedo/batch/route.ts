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

    const body = await request.json();
    const { price, minprice, fixedprice, domainIds } = body as {
      price: number;
      minprice: number;
      fixedprice: 0 | 1;
      domainIds: string[];
    };

    if (!domainIds?.length) {
      return NextResponse.json({ error: "No domains selected" }, { status: 400 });
    }
    if (!price || price <= 0) {
      return NextResponse.json({ error: "Asking price is required" }, { status: 400 });
    }

    const pricing = computeSedoPricing(price, minprice, fixedprice);

    const { data: allDomains } = await supabase
      .from("domains")
      .select("id, domain")
      .in("id", domainIds);

    const domains = (allDomains ?? []) as unknown as Array<{ id: string; domain: string }>;

    const { data: existingRows } = await supabase
      .from("sedo_listings")
      .select("domain_id")
      .in("domain_id", domainIds);

    const existingIds = new Set(
      ((existingRows ?? []) as unknown as Array<{ domain_id: string }>).map((r) => r.domain_id)
    );

    const toInsert = domains.filter((d) => !existingIds.has(d.id));
    const toEdit = domains.filter((d) => existingIds.has(d.id));

    const credentials = {
      partnerid: settings.sedo_partner_id,
      signkey: settings.sedo_signkey,
      username: settings.sedo_username,
      password: settings.sedo_password,
    };

    const errors: string[] = [];

    if (toInsert.length > 0) {
      try {
        const params: Record<string, string | number> = { ...credentials };
        toInsert.forEach((d, i) => {
          params[`domainentry[${i}][domain]`] = d.domain;
          params[`domainentry[${i}][forsale]`] = pricing.forsale;
          params[`domainentry[${i}][price]`] = pricing.price;
          params[`domainentry[${i}][minprice]`] = pricing.minprice;
          params[`domainentry[${i}][fixedprice]`] = pricing.fixedprice;
          params[`domainentry[${i}][currency]`] = pricing.currency;
          params[`domainentry[${i}][domainlanguage]`] = "en";
        });

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
        toEdit.forEach((d, i) => {
          params[`domainentry[${i}][domain]`] = d.domain;
          params[`domainentry[${i}][forsale]`] = pricing.forsale;
          params[`domainentry[${i}][price]`] = pricing.price;
          params[`domainentry[${i}][minprice]`] = pricing.minprice;
          params[`domainentry[${i}][fixedprice]`] = pricing.fixedprice;
          params[`domainentry[${i}][currency]`] = pricing.currency;
        });

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

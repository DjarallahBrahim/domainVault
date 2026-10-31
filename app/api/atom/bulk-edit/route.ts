import { NextRequest, NextResponse } from "next/server";
import { assertAtomSuccess, callAtom, isAtomError } from "@/lib/atom/client";
import { isValidAsciiDomain, toAsciiDomain } from "@/lib/atom/names";
import { validateAtomPrice } from "@/lib/atom/pricing";
import { authenticateAtom, readJson } from "@/lib/atom/route-helpers";
import type { AtomMessageResponse } from "@/types/atom";

interface BulkItem {
  domain?: string;
  price?: number | string;
}

interface BulkBody {
  items?: BulkItem[];
}

/** Bulk-updates Atom selling prices. Each item is independent. */
export async function POST(request: NextRequest) {
  const auth = await authenticateAtom();
  if (!auth.ok) return auth.response;

  const body = await readJson<BulkBody>(request);
  const items = body?.items ?? [];

  if (items.length === 0) {
    return NextResponse.json({ error: "No domains supplied" }, { status: 400 });
  }
  if (items.length > 200) {
    return NextResponse.json({ error: "Update at most 200 domains per batch" }, { status: 400 });
  }

  const succeeded: Array<{ domain: string; price: number }> = [];
  const failed: Array<{ domain: string; message: string; status: number }> = [];

  for (const raw of items) {
    const domain = toAsciiDomain(String(raw?.domain ?? ""));
    const price = validateAtomPrice(raw?.price);

    if (!domain || !isValidAsciiDomain(domain)) {
      failed.push({ domain, message: "Invalid domain name", status: 400 });
      continue;
    }
    if (price === null) {
      failed.push({
        domain,
        message: "Selling price must be greater than 0",
        status: 400,
      });
      continue;
    }

    try {
      const result = await callAtom<AtomMessageResponse>(
        auth.credentials,
        "GET",
        "/update-selling-price",
        { domain_name: domain, selling_price: price }
      );
      assertAtomSuccess(result);
      succeeded.push({ domain, price });
    } catch (error) {
      failed.push({
        domain,
        message: error instanceof Error ? error.message : "Could not update the Atom price",
        status: isAtomError(error) ? error.status : 500,
      });
    }
  }

  return NextResponse.json({ data: { succeeded, failed } });
}

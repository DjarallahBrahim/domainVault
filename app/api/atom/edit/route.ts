import { NextRequest, NextResponse } from "next/server";
import { assertAtomSuccess, callAtom } from "@/lib/atom/client";
import { toAsciiDomain, isValidAsciiDomain } from "@/lib/atom/names";
import { validateAtomPrice } from "@/lib/atom/pricing";
import { atomErrorResponse, authenticateAtom, readJson } from "@/lib/atom/route-helpers";
import type { AtomMessageResponse } from "@/types/atom";

interface EditBody {
  domain?: string;
  price?: number | string;
}

/** Updates the selling price of an existing Atom listing. */
export async function POST(request: NextRequest) {
  const auth = await authenticateAtom();
  if (!auth.ok) return auth.response;

  const body = await readJson<EditBody>(request);
  const domain = toAsciiDomain(String(body?.domain ?? ""));
  const price = validateAtomPrice(body?.price);

  if (!domain || !isValidAsciiDomain(domain)) {
    return NextResponse.json({ error: "Enter a valid domain name" }, { status: 400 });
  }
  if (price === null) {
    return NextResponse.json({ error: "Selling price must be greater than 0" }, { status: 400 });
  }

  try {
    const result = await callAtom<AtomMessageResponse>(
      auth.credentials,
      "GET",
      "/update-selling-price",
      { domain_name: domain, selling_price: price }
    );
    assertAtomSuccess(result);

    return NextResponse.json({
      data: { domain, price, message: result?.message },
    });
  } catch (error) {
    return atomErrorResponse(error);
  }
}

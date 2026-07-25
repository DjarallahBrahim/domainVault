import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const tags = searchParams.get("tags") ?? "";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(1000, Math.max(1, Number(searchParams.get("pageSize")) || 50));

  const supabase = await createClient();

  const baseQuery = () => {
    let q = supabase
      .from("domains")
      .select("domain, notes, tags, bin", { count: "exact" })
      .eq("status", "active")
      .not("bin", "is", null);

    if (search) q = q.ilike("domain", `%${search}%`);

    if (tags) {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      if (tagList.length > 0) q = q.contains("tags", tagList);
    }

    if (minPrice) q = q.gte("bin", Number(minPrice));
    if (maxPrice) q = q.lte("bin", Number(maxPrice));

    return q;
  };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await baseQuery()
    .order("domain")
    .range(from, to);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch domains" }, { status: 500 });
  }

  return NextResponse.json({
    domains: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  });
}

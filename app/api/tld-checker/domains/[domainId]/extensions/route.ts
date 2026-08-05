import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ domainId: string }> }
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { domainId } = await params;

  const { data: domain } = await supabase
    .from("domains")
    .select("id")
    .eq("id", domainId)
    .eq("user_id", authData.user.id)
    .single();

  if (!domain) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }

  const { data: checks, error } = await supabase
    .from("domain_extension_checks")
    .select("tld, full_domain, is_reserved, is_live")
    .eq("domain_id", domainId)
    .eq("is_reserved", true)
    .order("tld");

  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch extension data" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: (checks ?? []).map((c: any) => ({
      tld: c.tld,
      fullDomain: c.full_domain,
      isReserved: c.is_reserved,
      isLive: c.is_live,
    })),
  });
}

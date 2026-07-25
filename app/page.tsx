import { createClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

interface ShowcaseDomain {
  domain: string;
  notes: string | null;
  tags: string[] | null;
  bin: number | null;
}

export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: showcaseData } = await supabase
    .from("domains")
    .select("domain, notes, tags, bin")
    .eq("status", "active")
    .not("bin", "is", null)
    .order("domain")
    .limit(6);

  const showcaseDomains = (showcaseData ?? []) as unknown as ShowcaseDomain[];

  return (
    <LandingPage
      isAuthenticated={!!user}
      showcaseDomains={showcaseDomains}
    />
  );
}

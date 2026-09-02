import { PromotingPage } from "@/components/promoting/PromotingPage";

export default async function PromotingPageRoute({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain } = await searchParams;
  return <PromotingPage initialDomainId={domain ?? null} />;
}

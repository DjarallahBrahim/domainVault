import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchDomain } from "@/lib/supabase/queries/domains";
import { DomainDetailForm } from "@/components/domains/domain-detail-form";

export const metadata: Metadata = {
  title: "Domain Details",
};

interface DomainDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DomainDetailPage({
  params,
}: DomainDetailPageProps) {
  const { id } = await params;

  try {
    const domain = await fetchDomain(id);

    return <DomainDetailForm domain={domain} />;
  } catch {
    notFound();
  }
}

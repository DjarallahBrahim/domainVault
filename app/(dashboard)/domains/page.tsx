import type { Metadata } from "next";
import {
  fetchDomains,
  fetchAllTlds,
  fetchAllRegistrars,
} from "@/lib/supabase/queries/domains";
import { DomainListClient } from "@/components/domains/domain-list-client";

export const metadata: Metadata = {
  title: "Domains",
};

interface DomainsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DomainsPage({
  searchParams,
}: DomainsPageProps) {
  const params = await searchParams;

  const filters = {
    status:
      typeof params.status === "string" ? params.status : undefined,
    tld: typeof params.tld === "string" ? params.tld : undefined,
    search:
      typeof params.search === "string" ? params.search : undefined,
    sort:
      typeof params.sort === "string" ? params.sort : undefined,
    order:
      typeof params.order === "string" ? params.order : undefined,
    page:
      typeof params.page === "string"
        ? Number(params.page)
        : undefined,
    pageSize:
      typeof params.pageSize === "string"
        ? Number(params.pageSize)
        : undefined,
    expiry:
      typeof params.expiry === "string" ? params.expiry : undefined,
    registrars:
      typeof params.registrar === "string" ? params.registrar : undefined,
  };

  const [initialData, tlds, registrars] = await Promise.all([
    fetchDomains(filters),
    fetchAllTlds(),
    fetchAllRegistrars(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold font-display mb-6">Domains</h1>
      <DomainListClient initialData={initialData} tlds={tlds} registrars={registrars} />
    </div>
  );
}

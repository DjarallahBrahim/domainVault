import type { Metadata } from "next";
import { fetchSales } from "@/lib/supabase/queries/sales";
import { SalesClient } from "@/components/sales/sales-client";

export const metadata: Metadata = {
  title: "Sales",
};

interface SalesPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SalesPage({ searchParams }: SalesPageProps) {
  const params = await searchParams;

  const filters = {
    sort: typeof params.sort === "string" ? params.sort : undefined,
    order: typeof params.order === "string" ? params.order : undefined,
    startDate:
      typeof params.startDate === "string" ? params.startDate : undefined,
    endDate:
      typeof params.endDate === "string" ? params.endDate : undefined,
    page:
      typeof params.page === "string" ? Number(params.page) : undefined,
  };

  const initialData = await fetchSales(filters);

  return <SalesClient initialData={initialData} />;
}

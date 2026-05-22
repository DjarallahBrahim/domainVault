"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import { queryKeys } from "@/lib/query-keys";
import { fetchSales, deleteSale } from "@/lib/supabase/queries/sales-client";
import { SalesSummaryCards } from "@/components/sales/sales-summary-cards";
import { SalesList } from "@/components/sales/sales-list";
import { SalesLogForm } from "@/components/sales/sales-log-form";
import { SalesDeleteDialog } from "@/components/sales/sales-delete-dialog";
import { SalesEmptyState } from "@/components/sales/sales-empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/types/supabase";

type SaleRow = Database["public"]["Tables"]["sales"]["Row"];

interface SalesClientProps {
  initialData: Awaited<ReturnType<typeof fetchSales>>;
}

export function SalesClient({ initialData }: SalesClientProps) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const prefilledDomain = searchParams.get("domain") ?? undefined;

  const [showForm, setShowForm] = useState(!!prefilledDomain);
  const [editingSale, setEditingSale] = useState<SaleRow | null>(null);
  const [deletingSaleId, setDeletingSaleId] = useState<string | null>(null);

  const filters = Object.fromEntries(searchParams.entries());

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.domains.list({ ...filters, type: "sales" }),
    queryFn: () =>
      fetchSales({
        sort: filters.sort,
        order: filters.order,
        startDate: filters.startDate,
        endDate: filters.endDate,
        page: filters.page ? Number(filters.page) : 1,
      }),
    initialData,
    staleTime: 10 * 1000,
  });

  const totalRevenue = data.sales.reduce(
    (sum: number, s: SaleRow) => sum + s.sale_price,
    0
  );
  const avgSale =
    data.sales.length > 0 ? totalRevenue / data.sales.length : 0;
  const highestSale =
    data.sales.length > 0
      ? Math.max(...data.sales.map((s: SaleRow) => s.sale_price))
      : 0;

  const handleDelete = async () => {
    if (!deletingSaleId) return;
    try {
      await deleteSale(deletingSaleId);
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success("Sale deleted");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to delete";
      toast.error("Delete failed", { description: message });
    } finally {
      setDeletingSaleId(null);
    }
  };

  const handleEdit = (sale: SaleRow) => {
    setEditingSale(sale);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
    setShowForm(false);
    setEditingSale(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Sales</h1>
        <button
          onClick={() => {
            setShowForm(!showForm);
            if (showForm) setEditingSale(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {showForm ? "Close Form" : "Log Sale"}
        </button>
      </div>

      {showForm && (
        <SalesLogForm
          prefilledDomain={prefilledDomain}
          saleToEdit={
            editingSale
              ? {
                  id: editingSale.id,
                  domain_name: editingSale.domain_name,
                  sale_price: editingSale.sale_price,
                  sold_at: editingSale.sold_at,
                  buyer: editingSale.buyer,
                  platform: editingSale.platform,
                  notes: editingSale.notes,
                }
              : undefined
          }
          onSuccess={handleFormSuccess}
        />
      )}

      {data.sales.length === 0 ? (
        <SalesEmptyState
          onLogSale={() => setShowForm(true)}
        />
      ) : (
        <>
          <SalesSummaryCards
            count={data.total}
            revenue={totalRevenue}
            average={Math.round(avgSale)}
            highest={highestSale}
          />
          <SalesList
            sales={data.sales}
            total={data.total}
            page={data.page}
            totalPages={data.totalPages}
            onEdit={handleEdit}
            onDelete={(id) => setDeletingSaleId(id)}
          />
        </>
      )}

      <SalesDeleteDialog
        open={deletingSaleId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSaleId(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}

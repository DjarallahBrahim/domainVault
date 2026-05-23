"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";
import { Save } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryKeys } from "@/lib/query-keys";
import {
  createSale,
  updateSale,
  type CreateSaleResult,
} from "@/lib/supabase/queries/sales-client";
import { saleFormSchema, type SaleFormInput } from "@/lib/validations/sales";

interface SalesLogFormProps {
  prefilledDomain?: string;
  saleToEdit?: {
    id: string;
    domain_name: string;
    sale_price: number;
    sold_at: string;
    buyer: string | null;
    platform: string | null;
    notes: string | null;
  };
  onSuccess?: () => void;
}

export function SalesLogForm({
  prefilledDomain,
  saleToEdit,
  onSuccess,
}: SalesLogFormProps) {
  const queryClient = useQueryClient();
  const isEdit = !!saleToEdit;
  const [warning, setWarning] = useState<string | null>(null);
  const [warningConfirmed, setWarningConfirmed] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SaleFormInput>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: saleToEdit
      ? {
          domain_name: saleToEdit.domain_name,
          sale_price: saleToEdit.sale_price,
          sold_at: saleToEdit.sold_at,
          buyer: saleToEdit.buyer ?? "",
          platform: saleToEdit.platform ?? "",
          notes: saleToEdit.notes ?? "",
        }
      : {
          domain_name: prefilledDomain ?? "",
          sale_price: undefined as unknown as number,
          sold_at: "",
          buyer: "",
          platform: "",
          notes: "",
        },
  });

  const createMutation = useMutation({
    mutationFn: (data: SaleFormInput) =>
      createSale({
        domain_name: data.domain_name,
        sale_price: data.sale_price,
        sold_at: data.sold_at,
        buyer: data.buyer || null,
        platform: data.platform || null,
        notes: data.notes || null,
      }),
    onSuccess: (result: CreateSaleResult) => {
      if (result.warning && !warningConfirmed) {
        setWarning(result.warning);
        return;
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success("Sale logged");
      reset();
      setWarning(null);
      setWarningConfirmed(false);
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error("Failed to log sale", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: SaleFormInput) =>
      updateSale(saleToEdit!.id, {
        domain_name: data.domain_name,
        sale_price: data.sale_price,
        sold_at: data.sold_at,
        buyer: data.buyer || null,
        platform: data.platform || null,
        notes: data.notes || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success("Sale updated");
      onSuccess?.();
    },
    onError: (error: Error) => {
      toast.error("Failed to update sale", { description: error.message });
    },
  });

  const onSubmit = (data: SaleFormInput) => {
    if (isEdit) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {isEdit ? "Edit Sale" : "Log Sale"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {warning && !warningConfirmed && (
          <div className="mb-4 p-3 rounded-md bg-accent-warning/10 border border-accent-warning/20">
            <p className="text-sm text-accent-warning mb-2">
              {warning === "expired"
                ? "This domain is expired."
                : "This domain is already marked as sold."}
            </p>
            <button
              type="button"
              onClick={() => setWarningConfirmed(true)}
              className="px-3 py-1.5 rounded-md bg-accent-warning text-white text-xs font-medium hover:bg-accent-warning/90"
            >
              Log Sale Anyway
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="domain_name">Domain Name</Label>
              <Input
                id="domain_name"
                {...register("domain_name")}
                readOnly={!!prefilledDomain && !isEdit}
                placeholder="example.com"
                className={!!prefilledDomain && !isEdit ? "bg-bg-elevated cursor-not-allowed" : ""}
              />
              {errors.domain_name && (
                <p className="text-xs text-accent-danger">
                  {errors.domain_name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sale_price">Sale Price ($)</Label>
              <Input
                id="sale_price"
                type="number"
                step="0.01"
                min="0.01"
                {...register("sale_price", { valueAsNumber: true })}
                placeholder="500.00"
              />
              {errors.sale_price && (
                <p className="text-xs text-accent-danger">
                  {errors.sale_price.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sold_at">Sale Date</Label>
              <Input
                id="sold_at"
                type="date"
                {...register("sold_at")}
                max={new Date().toISOString().split("T")[0]}
              />
              {errors.sold_at && (
                <p className="text-xs text-accent-danger">
                  {errors.sold_at.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="buyer">Buyer (optional)</Label>
              <Input
                id="buyer"
                {...register("buyer")}
                placeholder="e.g., John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="platform">Platform (optional)</Label>
              <Input
                id="platform"
                {...register("platform")}
                placeholder="e.g., Afternic, Sedo, Private"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              rows={2}
              placeholder="Any notes about this sale..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 transition-colors"
            >
              <Save className="h-4 w-4" />
              {isPending
                ? isEdit
                  ? "Saving..."
                  : "Logging..."
                : isEdit
                  ? "Save Changes"
                  : "Log Sale"}
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

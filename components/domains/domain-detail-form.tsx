"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Save, DollarSign } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DomainStatusBadge } from "@/components/domains/domain-status-badge";
import { DomainDeleteDialog } from "@/components/domains/domain-delete-dialog";
import { domainEditSchema, type DomainEdit } from "@/lib/validations/domain";
import { updateDomain, deleteDomain } from "@/lib/supabase/queries/domains-client";
import { createSale, deleteSale } from "@/lib/supabase/queries/sales-client";
import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DomainDetailFormProps {
  domain: DomainRow;
}

export function DomainDetailForm({ domain }: DomainDetailFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [salePrice, setSalePrice] = useState("");
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split("T")[0]);
  const [saleBuyer, setSaleBuyer] = useState("");
  const [salePlatform, setSalePlatform] = useState("Direct");
  const [saleNotes, setSaleNotes] = useState("");

  const { data: existingSale } = useQuery({
    queryKey: ["sale", domain.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales")
        .select("id, sale_price, sold_at, buyer, platform, notes")
        .eq("domain_id", domain.id)
        .maybeSingle();
      if (error) return null;
      return data as unknown as {
        id: string;
        sale_price: number;
        sold_at: string;
        buyer: string | null;
        platform: string | null;
        notes: string | null;
      } | null;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (existingSale) {
      setSalePrice(String(existingSale.sale_price));
      setSaleDate(existingSale.sold_at);
      setSaleBuyer(existingSale.buyer ?? "");
      setSalePlatform(existingSale.platform ?? "Direct");
      setSaleNotes(existingSale.notes ?? "");
    }
  }, [existingSale]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<DomainEdit>({
    resolver: zodResolver(domainEditSchema),
    defaultValues: {
      status: domain.status,
      registrar: domain.registrar,
      purchase_price: domain.purchase_price,
      bin: (domain as Record<string, unknown>).bin as number | null | undefined,
      notes: domain.notes,
      tags: domain.tags,
    },
  });

  const statusValue = watch("status");
  const tagsValue = watch("tags");
  const showSaleFields = statusValue === "sold";

  const saveMutation = useMutation({
    mutationFn: async (data: DomainEdit) => {
      const wasSold = domain.status === "sold";
      const willBeSold = data.status === "sold";

      if (wasSold && !willBeSold) {
        if (existingSale?.id) {
          await deleteSale(existingSale.id);
        }
        await updateDomain(domain.id, data as Parameters<typeof updateDomain>[1]);
        return;
      }

      if (!wasSold && willBeSold) {
        await createSale({
          domain_name: domain.domain,
          sale_price: Number(salePrice) || 0,
          sold_at: saleDate,
          buyer: saleBuyer || undefined,
          platform: salePlatform || undefined,
          notes: saleNotes || undefined,
        } as never);
        await updateDomain(domain.id, data as Parameters<typeof updateDomain>[1]);
        return;
      }

      if (willBeSold && existingSale?.id) {
        if (existingSale.id) {
          await deleteSale(existingSale.id);
        }
        await createSale({
          domain_name: domain.domain,
          sale_price: Number(salePrice) || 0,
          sold_at: saleDate,
          buyer: saleBuyer || undefined,
          platform: salePlatform || undefined,
          notes: saleNotes || undefined,
        } as never);
      }

      await updateDomain(domain.id, data as Parameters<typeof updateDomain>[1]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      queryClient.invalidateQueries({ queryKey: ["sale", domain.id] });
      toast.success("Domain updated");
    },
    onError: (error: Error) => {
      toast.error("Save failed", { description: error.message });
    },
  });

  const onSave = (data: DomainEdit) => {
    saveMutation.mutate(data);
  };

  const handleDelete = async () => {
    try {
      await deleteDomain(domain.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      toast.success("Domain deleted");
      router.push("/domains");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete";
      toast.error("Delete failed", { description: message });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Domains
          </button>
        </div>
        <Link
          href={`/sales?domain=${encodeURIComponent(domain.domain)}`}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent-success/10 text-accent-success text-sm font-medium hover:bg-accent-success/20 transition-colors"
        >
          <DollarSign className="h-4 w-4" />
          Log Sale
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold font-display">
          <span className="font-mono">{domain.domain}</span>
        </h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm text-text-muted">.{domain.tld}</span>
          <DomainStatusBadge status={statusValue} />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Domain Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSave)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input id="domain" value={domain.domain} readOnly className="font-mono bg-bg-elevated cursor-not-allowed" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tld">TLD</Label>
                <Input id="tld" value={`.${domain.tld}`} readOnly className="bg-bg-elevated cursor-not-allowed" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiration_date">Expiration Date</Label>
                <Input id="expiration_date" value={domain.expiration_date} readOnly className="bg-bg-elevated cursor-not-allowed" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={statusValue}
                  onValueChange={(value) => setValue("status", value as DomainEdit["status"], { shouldDirty: true })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrar">Registrar</Label>
                <Input id="registrar" {...register("registrar")} placeholder="e.g., GoDaddy, Namecheap" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchase_price">Purchase Price ($)</Label>
                <Input id="purchase_price" type="number" step="0.01" min="0" {...register("purchase_price", { valueAsNumber: true })} placeholder="0.00" />
                {errors.purchase_price && <p className="text-xs text-accent-danger">{errors.purchase_price.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bin">BIN ($)</Label>
                <Input id="bin" type="number" step="0.01" min="0" {...register("bin", { valueAsNumber: true })} placeholder="0.00" />
                {errors.bin && <p className="text-xs text-accent-danger">{errors.bin.message}</p>}
              </div>
            </div>

            {showSaleFields && (
              <div className="space-y-4 pt-2 pb-2 px-4 border border-accent-success/20 rounded-lg bg-accent-success/5 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-accent-success" />
                  <p className="text-sm font-medium text-accent-success">Sale Details</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sale_price">Sale Price *</Label>
                    <Input id="sale_price" type="number" step="0.01" min="0" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} placeholder="0.00" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_date">Sale Date *</Label>
                    <Input id="sale_date" type="date" value={saleDate} onChange={(e) => setSaleDate(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_buyer">Buyer</Label>
                    <Input id="sale_buyer" value={saleBuyer} onChange={(e) => setSaleBuyer(e.target.value)} placeholder="Buyer name or company" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sale_platform">Platform</Label>
                    <Select value={salePlatform} onValueChange={setSalePlatform}>
                      <SelectTrigger id="sale_platform">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Direct">Direct</SelectItem>
                        <SelectItem value="Sedo">Sedo</SelectItem>
                        <SelectItem value="Afternic">Afternic</SelectItem>
                        <SelectItem value="Dan.com">Dan.com</SelectItem>
                        <SelectItem value="Flippa">Flippa</SelectItem>
                        <SelectItem value="GoDaddy Auctions">GoDaddy Auctions</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sale_notes">Sale Notes</Label>
                  <Textarea id="sale_notes" value={saleNotes} onChange={(e) => setSaleNotes(e.target.value)} rows={2} placeholder="Any notes about this sale..." />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags-input"
                value={tagsValue?.join(", ") ?? ""}
                onChange={(e) => {
                  const arr = e.target.value.split(",").map((t) => t.trim()).filter((t) => t.length > 0);
                  setValue("tags", arr.length > 0 ? arr : null, { shouldDirty: true });
                }}
                placeholder="e.g., premium, brandable (comma separated)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register("notes")} rows={3} placeholder="Any notes about this domain..." />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <button type="button" onClick={() => setShowDeleteDialog(true)} className="px-4 py-2 rounded-md text-sm font-medium text-accent-danger hover:bg-accent-danger/10 transition-colors">
                Delete Domain
              </button>

              <button type="submit" disabled={!isDirty || saveMutation.isPending} className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <Save className="h-4 w-4" />
                {saveMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      <DomainDeleteDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} count={1} onConfirm={handleDelete} />
    </div>
  );
}

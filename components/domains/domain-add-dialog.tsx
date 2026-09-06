"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TagInput } from "@/components/domains/tag-input";
import { queryKeys } from "@/lib/query-keys";
import { manualEntrySchema, type ManualEntryInput } from "@/lib/validations/domain";
import { insertSingleDomain, updateDomain } from "@/lib/supabase/queries/domains-client";
import { useWhoisAnalysis } from "@/lib/hooks/useWhoisAnalysis";
import { WhoisAnalyse } from "@/components/whois/whois-analyse";
import { RegistrarAutocomplete } from "@/components/whois/registrar-autocomplete";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DomainAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: DomainRow;
}

export function DomainAddDialog({ open, onOpenChange, domain }: DomainAddDialogProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEdit = !!domain;

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(manualEntrySchema),
    defaultValues: {
      domain: domain?.domain ?? "",
      expiration_date: domain?.expiration_date ?? "",
      purchase_price: domain?.purchase_price ?? null,
      registrar: domain?.registrar ?? null,
      notes: domain?.notes ?? null,
      tags: domain?.tags?.join(", ") ?? null,
    },
  });

  const [status, setStatus] = useState(domain?.status ?? "active");
  const [tags, setTags] = useState<string[]>(domain?.tags ?? []);

  const whois = useWhoisAnalysis({
    setExpiration: (value) => setValue("expiration_date", value),
    setRegistrar: (value) => setValue("registrar", value),
  });

  useEffect(() => {
    if (open) {
      whois.reset();
      if (domain) {
        reset({
          domain: domain.domain,
          expiration_date: domain.expiration_date,
          purchase_price: domain.purchase_price,
          registrar: domain.registrar,
          notes: domain.notes,
          tags: domain.tags?.join(", ") ?? null,
        });
        setStatus(domain.status ?? "active");
        setTags(domain.tags ?? []);
      } else {
        reset({
          domain: "",
          expiration_date: "",
          purchase_price: null,
          registrar: null,
          notes: null,
          tags: null,
        });
        setStatus("active");
        setTags([]);
      }
      setServerError(null);
    }
  }, [open, domain, reset, whois.reset]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ManualEntryInput) => {
      if (isEdit && domain) {
        await updateDomain(domain.id, {
          status,
          registrar: data.registrar ?? null,
          purchase_price: data.purchase_price ?? null,
          notes: data.notes ?? null,
          tags: tags.length > 0 ? tags : null,
        } as never);
      } else {
        await insertSingleDomain({
          domain: data.domain,
          expiration_date: data.expiration_date,
          purchase_price: data.purchase_price ?? null,
          registrar: data.registrar ?? null,
          notes: data.notes ?? null,
          tags: tags.length > 0 ? tags.join(",") : null,
        });
      }
    },
    onSuccess: () => {
      toast.success(isEdit ? "Domain updated" : "Domain added");
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error.message === "Domain already exists in your portfolio") {
        setServerError(error.message);
      } else {
        toast.error(error.message || "Failed to save domain");
      }
    },
  });

  async function handleAnalyse() {
    if (isEdit) return;
    const valid = await trigger("domain");
    if (!valid) return;
    setServerError(null);
    await whois.run(getValues("domain").trim().toLowerCase());
  }

  function onSubmit(data: ManualEntryInput) {
    setServerError(null);
    mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Domain" : "Add Domain"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the domain details below."
              : "Manually add a domain to your portfolio."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dialog-domain">Domain Name *</Label>
            <Input
              id="dialog-domain"
              placeholder="example.com"
              disabled={isEdit}
              {...register("domain")}
            />
            {errors.domain && <p className="text-sm text-accent-danger">{errors.domain.message}</p>}
            {serverError && <p className="text-sm text-accent-danger">{serverError}</p>}
          </div>

          {!isEdit && (
            <WhoisAnalyse
              loading={whois.analysis.status === "loading"}
              onAnalyse={handleAnalyse}
              analysis={whois.analysis}
              onPickAllowed={whois.updateRegistrar}
            />
          )}

          <div className="space-y-2">
            <Label htmlFor="dialog-expiration">Expiration Date *</Label>
            <Input id="dialog-expiration" type="date" {...register("expiration_date")} />
            {errors.expiration_date && (
              <p className="text-sm text-accent-danger">{errors.expiration_date.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-price">Purchase Price</Label>
            <Input
              id="dialog-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("purchase_price")}
            />
            {errors.purchase_price && (
              <p className="text-sm text-accent-danger">{errors.purchase_price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger id="dialog-status">
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
            <Label htmlFor="dialog-registrar">Registrar</Label>
            <RegistrarAutocomplete
              id="dialog-registrar"
              value={watch("registrar") ?? ""}
              onValueChange={whois.updateRegistrar}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dialog-notes">Notes</Label>
            <Input
              id="dialog-notes"
              placeholder="Any notes about this domain"
              {...register("notes")}
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="Type and press Enter to add tags"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || (!isEdit && whois.registrarBlocked)}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Domain"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

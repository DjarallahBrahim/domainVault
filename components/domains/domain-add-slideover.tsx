"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";
import { TagInput } from "@/components/domains/tag-input";
import { queryKeys } from "@/lib/query-keys";
import { manualEntrySchema, type ManualEntryInput } from "@/lib/validations/domain";
import { insertSingleDomain, updateDomain, fetchRegistrarList } from "@/lib/supabase/queries/domains-client";
import type { Database } from "@/types/supabase";

type DomainRow = Database["public"]["Tables"]["domains"]["Row"];

interface DomainAddSlideoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  domain?: DomainRow;
}

export function DomainAddSlideover({ open, onOpenChange, domain }: DomainAddSlideoverProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [autocompleteOpen, setAutocompleteOpen] = useState(false);
  const [registrarInput, setRegistrarInput] = useState("");

  const { data: registrarList = [] } = useQuery({
    queryKey: ["registrars"],
    queryFn: fetchRegistrarList,
    staleTime: 60 * 1000,
  });

  const isEdit = !!domain;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
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

  useEffect(() => {
    if (open) {
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
        setRegistrarInput(domain.registrar ?? "");
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
        setRegistrarInput("");
      }
      setServerError(null);
    }
  }, [open, domain, reset]);

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

  function onSubmit(data: ManualEntryInput) {
    setServerError(null);
    mutate(data);
  }

  const filteredRegistrars = registrarList.filter((r) =>
    r.toLowerCase().includes(registrarInput.toLowerCase())
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">{isEdit ? "Edit Domain" : "Add Domain"}</h2>
          <p className="text-sm text-text-muted mt-1">
            {isEdit
              ? "Update the domain details below."
              : "Manually add a domain to your portfolio."}
          </p>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slide-domain">Domain Name *</Label>
            <Input
              id="slide-domain"
              placeholder="example.com"
              disabled={isEdit}
              {...register("domain")}
            />
            {errors.domain && (
              <p className="text-sm text-accent-danger">{errors.domain.message}</p>
            )}
            {serverError && (
              <p className="text-sm text-accent-danger">{serverError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slide-expiration">Expiration Date *</Label>
            <Input
              id="slide-expiration"
              type="date"
              {...register("expiration_date")}
            />
            {errors.expiration_date && (
              <p className="text-sm text-accent-danger">
                {errors.expiration_date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slide-price">Purchase Price</Label>
            <Input
              id="slide-price"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              {...register("purchase_price")}
            />
            {errors.purchase_price && (
              <p className="text-sm text-accent-danger">
                {errors.purchase_price.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slide-status">Status</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger id="slide-status">
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
            <Label htmlFor="slide-registrar">Registrar</Label>
            <div className="relative">
              <Input
                id="slide-registrar"
                placeholder="GoDaddy, Namecheap..."
                value={registrarInput}
                onChange={(e) => {
                  setRegistrarInput(e.target.value);
                  setValue("registrar", e.target.value);
                  setAutocompleteOpen(true);
                }}
                onFocus={() => setAutocompleteOpen(true)}
                onBlur={() => setTimeout(() => setAutocompleteOpen(false), 200)}
              />
              {autocompleteOpen && registrarInput && filteredRegistrars.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-bg-elevated border border-border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {filteredRegistrars.slice(0, 8).map((r) => (
                    <button
                      key={r}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-surface"
                      onMouseDown={() => {
                        setRegistrarInput(r);
                        setValue("registrar", r);
                        setAutocompleteOpen(false);
                      }}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="slide-notes">Notes</Label>
            <Input
              id="slide-notes"
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
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save Changes" : "Add Domain"}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}

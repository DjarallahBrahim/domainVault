"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TagInput } from "@/components/domains/tag-input";
import { queryKeys } from "@/lib/query-keys";
import { manualEntrySchema, type ManualEntryInput } from "@/lib/validations/domain";
import { insertSingleDomain } from "@/lib/supabase/queries/domains-client";
import { useWhoisAnalysis } from "@/lib/hooks/useWhoisAnalysis";
import { WhoisAnalyse } from "@/components/whois/whois-analyse";
import { RegistrarAutocomplete } from "@/components/whois/registrar-autocomplete";
import { Plus, CheckCircle2, XCircle } from "lucide-react";

export function ManualEntryTab() {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

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
  });

  const whois = useWhoisAnalysis({
    setExpiration: (value) => setValue("expiration_date", value),
    setRegistrar: (value) => setValue("registrar", value),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (data: ManualEntryInput) => {
      await insertSingleDomain({
        domain: data.domain,
        expiration_date: data.expiration_date,
        purchase_price: data.purchase_price ?? null,
        registrar: data.registrar ?? null,
        notes: data.notes ?? null,
        tags: tags.length > 0 ? tags.join(",") : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.all });
      setSuccessMessage("Domain added — add another");
      setServerError(null);
      reset({
        domain: "",
        expiration_date: "",
        purchase_price: null,
        registrar: null,
        notes: null,
        tags: null,
      });
      whois.reset();
      setTags([]);
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (error: Error) => {
      if (error.message === "Domain already exists in your portfolio") {
        setServerError(error.message);
      } else {
        setServerError(error.message || "Failed to add domain");
      }
      setSuccessMessage(null);
    },
  });

  function onSubmit(data: ManualEntryInput) {
    setServerError(null);
    setSuccessMessage(null);
    mutate(data);
  }

  async function handleAnalyse() {
    const valid = await trigger("domain");
    if (!valid) return;
    setServerError(null);
    setSuccessMessage(null);
    await whois.run(getValues("domain").trim().toLowerCase());
  }

  return (
    <div className="max-w-xl">
      {successMessage && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-accent-success/10 border border-accent-success/20">
          <CheckCircle2 className="h-4 w-4 text-accent-success shrink-0" />
          <p className="text-sm text-accent-success">{successMessage}</p>
        </div>
      )}
      {serverError && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-md bg-accent-danger/10 border border-accent-danger/20">
          <XCircle className="h-4 w-4 text-accent-danger shrink-0" />
          <p className="text-sm text-accent-danger">{serverError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manual-domain">Domain Name *</Label>
          <Input id="manual-domain" placeholder="example.com" {...register("domain")} />
          {errors.domain && <p className="text-sm text-accent-danger">{errors.domain.message}</p>}
        </div>

        <WhoisAnalyse
          loading={whois.analysis.status === "loading"}
          onAnalyse={handleAnalyse}
          analysis={whois.analysis}
          onPickAllowed={whois.updateRegistrar}
        />

        <div className="space-y-2">
          <Label htmlFor="manual-price">Purchase Price</Label>
          <Input
            id="manual-price"
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
          <Label htmlFor="manual-expiration">Expiration Date *</Label>
          <Input id="manual-expiration" type="date" {...register("expiration_date")} />
          {errors.expiration_date && (
            <p className="text-sm text-accent-danger">{errors.expiration_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-registrar">Registrar</Label>
          <RegistrarAutocomplete
            id="manual-registrar"
            value={watch("registrar") ?? ""}
            onValueChange={whois.updateRegistrar}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="manual-notes">Notes</Label>
          <Textarea
            id="manual-notes"
            placeholder="Any notes about this domain..."
            rows={2}
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

        <Button type="submit" disabled={isPending || whois.registrarBlocked} className="w-full">
          <Plus className="h-4 w-4 mr-1" />
          {isPending
            ? "Adding..."
            : whois.registrarBlocked
              ? "Choose a registrar above"
              : "Add Domain"}
        </Button>
      </form>
    </div>
  );
}

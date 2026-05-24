"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryKeys } from "@/lib/query-keys";
import { manualEntrySchema, type ManualEntryInput } from "@/lib/validations/domain";
import { insertSingleDomain } from "@/lib/supabase/queries/domains-client";
import { useState } from "react";

interface DomainAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DomainAddDialog({ open, onOpenChange }: DomainAddDialogProps) {
  const queryClient = useQueryClient();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualEntryInput>({
    resolver: zodResolver(manualEntrySchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: insertSingleDomain,
    onSuccess: () => {
      toast.success("Domain added");
      queryClient.invalidateQueries({ queryKey: queryKeys.domains.lists() });
      reset();
      onOpenChange(false);
    },
    onError: (error: Error) => {
      if (error.message === "Domain already exists in your portfolio") {
        setServerError(error.message);
      } else {
        toast.error(error.message || "Failed to add domain");
      }
    },
  });

  function onSubmit(data: ManualEntryInput) {
    setServerError(null);
    mutate(data);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      reset();
      setServerError(null);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Domain</DialogTitle>
          <DialogDescription>
            Manually add a domain to your portfolio.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-domain">Domain Name *</Label>
            <Input
              id="add-domain"
              placeholder="example.com"
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
            <Label htmlFor="add-expiration">Expiration Date *</Label>
            <Input
              id="add-expiration"
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
            <Label htmlFor="add-price">Purchase Price</Label>
            <Input
              id="add-price"
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
            <Label htmlFor="add-registrar">Registrar</Label>
            <Input
              id="add-registrar"
              placeholder="GoDaddy, Namecheap..."
              {...register("registrar")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-notes">Notes</Label>
            <Input
              id="add-notes"
              placeholder="Any notes about this domain"
              {...register("notes")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="add-tags">Tags</Label>
            <Input
              id="add-tags"
              placeholder="premium, brandable"
              {...register("tags")}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Domain"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

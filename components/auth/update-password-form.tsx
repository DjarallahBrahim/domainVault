"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Clock, KeyRound } from "lucide-react";
import { type UpdatePasswordInput, updatePasswordSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import { PasswordRequirements } from "./password-requirements";
import { FieldError } from "./field-error";
import { FormAlert } from "./form-alert";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePasswordInput>({
    resolver: zodResolver(updatePasswordSchema),
    mode: "onBlur",
  });

  const password = watch("password") ?? "";

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(Boolean(data.user));
      setChecking(false);
    });
  }, []);

  async function onSubmit(data: UpdatePasswordInput) {
    clearErrors("root");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: data.password });

    if (error) {
      setError("root", {
        message: error.message || "Failed to update password. Please try again.",
      });
      return;
    }

    toast.success("Password updated");
    router.push("/dashboard");
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-16">
        <div
          role="status"
          aria-label="Checking your reset link"
          className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-accent-primary"
        />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div>
        <div className="mb-8">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-accent-warning/10 text-accent-warning">
            <Clock className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Link expired</h1>
          <p className="mt-1.5 text-sm leading-6 text-text-muted">
            This password reset link is invalid or has expired. Request a new one to continue.
          </p>
        </div>

        <Link href="/reset-password" className="block">
          <Button size="lg" className="h-11 w-full">
            Request a new link
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <KeyRound className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Set a new password
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Choose a strong password you haven&apos;t used before.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormAlert>{errors.root?.message}</FormAlert>

        <div className="space-y-2">
          <Label htmlFor="password">New password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a new password"
            autoFocus
            className="h-10 bg-bg-surface"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <FieldError id="password-error">{errors.password?.message}</FieldError>
          <PasswordRequirements value={password} />
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}

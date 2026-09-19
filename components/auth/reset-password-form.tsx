"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { type ResetPasswordInput, resetPasswordSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";
import { FormAlert } from "./form-alert";

export function ResetPasswordForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: { email: defaultEmail },
  });

  async function onSubmit(data: ResetPasswordInput) {
    clearErrors("root");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });

    if (error) {
      setError("root", { message: "We couldn't send the reset email. Please try again." });
      return;
    }

    setSentTo(data.email);
  }

  if (sentTo) {
    return (
      <div>
        <div className="mb-8">
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
            Check your email
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-text-muted">
            We sent a password reset link to{" "}
            <span className="font-medium text-text-primary">{sentTo}</span>. Open it to choose a
            new password.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button size="lg" variant="outline" className="h-11 w-full">
              Back to sign in
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setSentTo(null)}
            className="w-full rounded text-center text-sm text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Didn&apos;t get it? Try another email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-text-muted transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to sign in
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Reset your password
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Enter your email and we&apos;ll send you a secure reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <FormAlert>{errors.root?.message}</FormAlert>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            autoFocus
            className="h-10 bg-bg-surface"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FieldError id="email-error">{errors.email?.message}</FieldError>
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </div>
  );
}

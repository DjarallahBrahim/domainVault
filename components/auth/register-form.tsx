"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type RegisterInput, registerSchema } from "@/lib/validations";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl } from "@/lib/site";
import { mapAuthError } from "@/lib/errors/supabase";
import { EMAIL_CONFIRMATION_REQUIRED } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "./password-input";
import { PasswordRequirements } from "./password-requirements";
import { FieldError } from "./field-error";
import { FormAlert } from "./form-alert";

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const password = watch("password") ?? "";

  async function onSubmit(data: RegisterInput) {
    clearErrors("root");

    const supabase = createClient();
    const { data: result, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: authCallbackUrl(),
      },
    });

    if (error) {
      setError("root", { message: mapAuthError(error) });
      return;
    }

    // Already signed in (email confirmation disabled) → straight in.
    if (result.session) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    // Email confirmation is not required: sign the user in directly instead of
    // sending them to a verification screen.
    if (!EMAIL_CONFIRMATION_REQUIRED) {
      const { data: signIn, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });
      if (!signInError && signIn.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
    }

    // Confirmation is still enforced server-side → send them to their inbox.
    router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-text-muted">
          Start managing your domain portfolio — free, no credit card required.
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

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            autoComplete="new-password"
            placeholder="Create a password"
            className="h-10 bg-bg-surface"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <FieldError id="password-error">{errors.password?.message}</FieldError>
          <PasswordRequirements value={password} />
        </div>

        <Button type="submit" size="lg" className="h-11 w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create free account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-accent-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}

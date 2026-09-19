"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheck } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function VerifyEmailContent({ email }: { email: string }) {
  const [isSending, setIsSending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleResend() {
    if (!email) {
      toast.error("We don't have an email address to resend to. Please sign up again.");
      return;
    }

    setIsSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setIsSending(false);

    if (error) {
      toast.error("Unable to resend. Please try again in a moment.");
      return;
    }

    setResent(true);
    toast.success("Verification email resent");
  }

  return (
    <div>
      <div className="mb-8">
        <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <MailCheck className="h-6 w-6" aria-hidden="true" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Verify your email
        </h1>
        <p className="mt-1.5 text-sm leading-6 text-text-muted">
          {email ? (
            <>
              We sent a verification link to{" "}
              <span className="font-medium text-text-primary">{email}</span>. Click it to
              activate your account.
            </>
          ) : (
            "Check your inbox for a verification link to activate your account."
          )}
        </p>
      </div>

      <div className="space-y-3">
        <Button
          size="lg"
          variant="outline"
          className="h-11 w-full"
          onClick={handleResend}
          disabled={isSending || !email}
        >
          {isSending ? "Sending…" : resent ? "Resend again" : "Resend verification email"}
        </Button>
        <Link href="/login" className="block">
          <Button size="lg" variant="ghost" className="h-11 w-full">
            Back to sign in
          </Button>
        </Link>
      </div>

      <p className="mt-6 text-center text-xs text-text-muted">
        Can&apos;t find it? Check your spam folder, then resend above.
      </p>
    </div>
  );
}

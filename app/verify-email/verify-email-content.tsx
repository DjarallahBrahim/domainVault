"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export function VerifyEmailContent() {
  const [isSending, setIsSending] = useState(false);

  async function handleResend() {
    setIsSending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: "",
    });

    setIsSending(false);

    if (error) {
      toast.error("Unable to resend. Please try again later.");
      return;
    }

    toast.success("Verification email resent. Check your inbox.");
  }

  return (
    <Card className="w-full max-w-md text-center">
      <CardHeader>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent-primary/10">
          <Mail className="h-6 w-6 text-accent-primary" />
        </div>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Check your inbox for a verification link. Click the link to activate your
          account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-text-muted">
          Didn&apos;t receive the email? Check your spam folder or click below to
          resend.
        </p>
      </CardContent>
      <CardFooter className="flex justify-center">
        <Button variant="outline" onClick={handleResend} disabled={isSending}>
          {isSending ? "Sending..." : "Resend verification email"}
        </Button>
      </CardFooter>
    </Card>
  );
}

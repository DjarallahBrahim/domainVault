import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password — DomainVault",
};

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <ResetPasswordForm />
    </main>
  );
}

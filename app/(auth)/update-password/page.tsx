import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Set New Password — DomainVault",
};

export default function UpdatePasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <UpdatePasswordForm />
    </main>
  );
}

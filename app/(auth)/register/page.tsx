import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Register — DomainVault",
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <RegisterForm />
    </main>
  );
}

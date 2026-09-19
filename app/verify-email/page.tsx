import type { Metadata } from "next";
import { VerifyEmailContent } from "./verify-email-content";

export const metadata: Metadata = {
  title: "Verify Email — DNfly.io",
};

export default function VerifyEmailPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <VerifyEmailContent />
    </main>
  );
}

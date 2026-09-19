import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login — DNfly.io",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const initialError =
    error === "auth_callback_failed"
      ? "We couldn't verify your link — it may have expired. Please request a new password reset."
      : null;

  return <LoginForm initialError={initialError} />;
}

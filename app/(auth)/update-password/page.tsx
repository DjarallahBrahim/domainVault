import type { Metadata } from "next";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata: Metadata = {
  title: "Set New Password — DNfly.io",
};

export default function UpdatePasswordPage() {
  return <UpdatePasswordForm />;
}

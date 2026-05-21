import type { AuthError } from "@supabase/supabase-js";

const ERROR_MAP: Record<string, string> = {
  "User already registered": "An account with this email already exists",
  "Invalid login credentials": "Invalid email or password",
  "Email not confirmed": "Please verify your email before logging in",
  "Email rate limit exceeded": "Too many requests. Please wait a moment and try again",
  "Password should be at least 6 characters": "Password must be at least 8 characters and contain a number",
  "Invalid email address": "Please enter a valid email address",
  "User not found": "No account found with this email address",
};

export function mapAuthError(error: AuthError | null): string {
  if (!error) return "An unexpected error occurred";

  const message = error.message;

  if (ERROR_MAP[message]) return ERROR_MAP[message];

  if (message.includes("rate limit")) return "Too many attempts. Please try again later";
  if (message.includes("network")) return "Connection error. Please check your internet connection";
  if (message.includes("expired")) return "Verification link has expired. Please request a new one";

  return message || "An unexpected error occurred";
}

import { AlertCircle } from "lucide-react";

/** Form-level error (bad credentials, network failure, …). Announced politely. */
export function FormAlert({ children }: { children?: React.ReactNode }) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-accent-danger/30 bg-accent-danger/5 px-3 py-2.5 text-sm text-accent-danger"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

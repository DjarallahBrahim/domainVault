import { AlertCircle } from "lucide-react";

/** Inline, screen-reader-announced error tied to a specific field. */
export function FieldError({ id, children }: { id?: string; children?: React.ReactNode }) {
  if (!children) return null;

  return (
    <p
      id={id}
      role="alert"
      className="flex items-start gap-1.5 text-sm text-accent-danger"
    >
      <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

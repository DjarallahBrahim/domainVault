import type { AfternicFastTransferStatus } from "@/types/afternic";

export type FastTransferTone = "success" | "warning" | "danger" | "muted" | "info";

export interface FastTransferInfo {
  label: string;
  hint: string;
  tone: FastTransferTone;
}

const INFO: Record<string, FastTransferInfo> = {
  ACTIVE: {
    label: "FT ✓",
    hint: "Fast Transfer is active.",
    tone: "success",
  },
  AWAITING_OPT_IN: {
    label: "Opt-in needed",
    hint: "Complete your registrar's opt-in process.",
    tone: "warning",
  },
  INACTIVE_BUYNOW_MISSING: {
    label: "Needs Buy Now",
    hint: "Set a Buy Now price to enable Fast Transfer.",
    tone: "warning",
  },
  INACTIVE_BUYNOW_HIGH: {
    label: "Price too high",
    hint: "Buy Now is above the current Fast Transfer limit. Lower it.",
    tone: "warning",
  },
  INELIGIBLE_REGISTRAR: {
    label: "Ineligible registrar",
    hint: "This registrar is not eligible for Fast Transfer.",
    tone: "muted",
  },
  INELIGIBLE_TLD: {
    label: "Ineligible TLD",
    hint: "This extension is not eligible for Fast Transfer.",
    tone: "muted",
  },
  PENDING_REVIEW: {
    label: "Under review",
    hint: "Afternic is reviewing this listing.",
    tone: "warning",
  },
  INACTIVE: {
    label: "FT inactive",
    hint: "Fast Transfer is not active for this listing.",
    tone: "warning",
  },
  USER_EXCLUDED: {
    label: "Excluded",
    hint: "Fast Transfer is excluded for this domain.",
    tone: "muted",
  },
  UNKNOWN: {
    label: "FT unknown",
    hint: "Fast Transfer status is unavailable.",
    tone: "muted",
  },
};

export function getFastTransferInfo(status: string | null | undefined): FastTransferInfo | null {
  if (!status) return null;
  return (
    INFO[status as AfternicFastTransferStatus] ?? {
      label: String(status),
      hint: String(status),
      tone: "muted",
    }
  );
}

export const FAST_TRANSFER_TONE_CLASS: Record<FastTransferTone, string> = {
  success: "bg-accent-success/10 text-accent-success ring-accent-success/20",
  warning: "bg-accent-warning/10 text-accent-warning ring-accent-warning/20",
  danger: "bg-accent-danger/10 text-accent-danger ring-accent-danger/20",
  info: "bg-accent-primary/10 text-accent-primary ring-accent-primary/20",
  muted: "bg-bg-elevated text-text-muted ring-border",
};

/** Icon colour used for the Fast Transfer bolt in table cells. */
export const FAST_TRANSFER_ICON_CLASS: Record<FastTransferTone, string> = {
  success: "text-accent-success",
  warning: "text-accent-warning",
  danger: "text-accent-danger",
  info: "text-accent-primary",
  muted: "text-text-muted",
};

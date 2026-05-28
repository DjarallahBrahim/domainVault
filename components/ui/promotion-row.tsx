"use client";

import { format } from "date-fns";

interface Domain {
  id: string;
  domain: string;
  expiration_date: string;
}

interface Stat {
  count: number;
  lastAt: string;
}

interface PromotionRowProps {
  domain: Domain;
  stat: Stat | null;
  isConfirming: boolean;
  onPromoteClick: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PromotionRow({
  domain,
  stat,
  isConfirming,
  onPromoteClick,
  onConfirm,
  onCancel,
}: PromotionRowProps) {
  return (
    <>
      <tr className="border-b border-border/50 hover:bg-bg-elevated/30 transition">
        <td className="py-3 font-mono text-sm">{domain.domain}</td>
        <td className="py-3 text-sm">
          {format(new Date(domain.expiration_date), "MMM d, yyyy")}
        </td>
        <td className="py-3 text-sm">
          {stat ? <span className="text-accent-success font-medium">{stat.count}×</span> : "—"}
        </td>
        <td className="py-3 text-sm text-text-muted">
          {stat?.lastAt
            ? format(new Date(stat.lastAt), "MMM d")
            : "—"}
        </td>
        <td className="py-3 text-right">
          <button
            onClick={onPromoteClick}
            className="text-xs px-3 py-1 rounded-md border border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white transition"
          >
            Promote
          </button>
        </td>
      </tr>

      {isConfirming && (
        <tr>
          <td colSpan={5} className="py-3 px-4 bg-accent-success/5 border-b border-accent-success/20">
            <div className="flex items-center gap-3 text-sm">
              <span>
                Confirm promotion of <strong className="font-mono">{domain.domain}</strong>?
              </span>
              <button
                onClick={onConfirm}
                className="text-accent-success font-medium hover:underline"
              >
                ✓ Yes
              </button>
              <button
                onClick={onCancel}
                className="text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

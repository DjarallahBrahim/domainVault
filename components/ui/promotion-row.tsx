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
        <td className="py-3 pr-2 font-mono text-sm whitespace-nowrap">{domain.domain}</td>
        <td className="py-3 px-2 text-sm whitespace-nowrap">
          {format(new Date(domain.expiration_date), "MMM d, yyyy")}
        </td>
        <td className="py-3 px-2 text-sm whitespace-nowrap">
          {stat ? <span className="text-accent-success font-medium">{stat.count}×</span> : "—"}
        </td>
        <td className="py-3 px-2 text-sm text-text-muted whitespace-nowrap">
          {stat?.lastAt
            ? format(new Date(stat.lastAt), "MMM d")
            : "—"}
        </td>
        <td className="py-3 pl-2 text-right">
          <button
            onClick={onPromoteClick}
            className="text-xs px-2.5 py-1 rounded-md border border-accent-primary text-accent-primary hover:bg-accent-primary hover:text-white transition whitespace-nowrap"
          >
            Promote
          </button>
        </td>
      </tr>

      {isConfirming && (
        <tr>
          <td colSpan={5} className="py-3 px-3 bg-accent-success/5 border-b border-accent-success/20">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
              <span className="text-text-muted">
                Promote <strong className="font-mono text-text-primary break-all">{domain.domain}</strong>?
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={onConfirm}
                  className="px-3 py-1 rounded-md bg-accent-success text-white text-xs font-medium hover:bg-accent-success/90 transition"
                >
                  Confirm
                </button>
                <button
                  onClick={onCancel}
                  className="text-xs text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

import Link from "next/link";

interface ShowcaseCardProps {
  domain: string;
  notes: string | null;
  tags: string[] | null;
  bin: number | null;
}

const TAG_COLORS = [
  { bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
  { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
  { bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  { bg: "bg-fuchsia-500/10", text: "text-fuchsia-400", border: "border-fuchsia-500/20" },
  { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  { bg: "bg-sky-500/10", text: "text-sky-400", border: "border-sky-500/20" },
];

function tagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function ShowcaseCard({ domain, notes, tags, bin }: ShowcaseCardProps) {
  const priceDisplay = bin
    ? (() => {
        const parts = bin.toLocaleString("en-US", {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2,
        }).split(".");
        return (
          <span className="inline-flex items-baseline gap-0.5">
            <span className="text-sm font-normal text-text-muted">$</span>
            <span className="font-mono text-2xl font-bold text-accent-success">
              {parts[0]}
            </span>
            {parts[1] && (
              <span className="font-mono text-sm font-medium text-accent-success/70">
                .{parts[1]}
              </span>
            )}
          </span>
        );
      })()
    : null;

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-6 flex flex-col h-full hover:border-accent-primary/40 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
      <div className="flex flex-col flex-1 items-center text-center gap-4">
        <h3 className="font-mono text-xl text-accent-primary font-bold pb-0.5 break-words group-hover:text-accent-primary/90 transition-colors text-center">
          {domain}
        </h3>

        {tags && tags.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-1.5">
            {tags.map((tag) => {
              const c = tagColor(tag);
              return (
                <span
                  key={tag}
                  className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-md border ${c.bg} ${c.text} ${c.border}`}
                >
                  {tag}
                </span>
              );
            })}
          </div>
        ) : (
          <div className="py-1" />
        )}

        <p className="text-sm text-text-muted leading-relaxed line-clamp-2 min-h-[2.5rem]">
          {notes || "\u2014"}
        </p>
      </div>

      <div className="pt-4 mt-4 border-t border-border group-hover:border-accent-primary/20 transition-colors text-center">
        {priceDisplay ?? (
          <Link
            href="#"
            className="text-sm text-accent-primary hover:underline font-medium"
          >
            Inquire
          </Link>
        )}
      </div>
    </div>
  );
}

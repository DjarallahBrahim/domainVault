import { Check, X } from "lucide-react";
import { SectionLabel } from "./shared";

const oldWaySteps = [
  "Export CSV",
  "Log into marketplace",
  "Upload domains",
  "Set prices",
  "Update listings",
  "Repeat for every marketplace",
  "Repeat whenever something changes",
];

const newWaySteps = ["Add domain", "Set price", "Choose marketplaces", "Publish automatically"];

export function ComparisonSection() {
  return (
    <section className="mx-auto grid max-w-7xl gap-6 px-4 pb-20 lg:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-8">
        <SectionLabel>The old way</SectionLabel>
        <h3 className="text-2xl font-extrabold">Stop managing domains manually.</h3>
        <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
          {oldWaySteps.map((i) => (
            <li key={i} className="flex items-center gap-2">
              <X className="h-4 w-4 shrink-0 text-destructive" /> {i}
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs font-medium italic text-muted-foreground">
          Time consuming. Error prone.
        </p>
      </div>
      <div className="rounded-2xl border border-primary/30 bg-tint p-8">
        <SectionLabel>With DNfly.io</SectionLabel>
        <h3 className="text-2xl font-extrabold">
          Just a few clicks. Everything else is automatic.
        </h3>
        <ul className="mt-6 space-y-3 text-sm font-medium">
          {newWaySteps.map((i) => (
            <li key={i} className="flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0 text-primary-deep" /> {i}
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-xl border border-border bg-card p-4 shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold">superbrand.com</p>
              <p className="text-xs text-muted-foreground">$2,499</p>
            </div>
            <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              Publish
            </span>
          </div>
          <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
            {["sedo", "Spaceship", "atom"].map((m) => (
              <div key={m} className="flex items-center justify-between">
                <span>{m}</span>
                <Check className="h-3.5 w-3.5 text-primary-deep" />
              </div>
            ))}
          </div>
        </div>
        <p className="mt-4 text-xs font-medium italic text-muted-foreground">
          Save hours. Focus on growing your portfolio.
        </p>
      </div>
    </section>
  );
}

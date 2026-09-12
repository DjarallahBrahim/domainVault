import { ArrowRight } from "lucide-react";
import { SectionLabel } from "./shared";
import { workflowSteps } from "./data";

export function WorkflowSection() {
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-20">
      <SectionLabel>Simple workflow</SectionLabel>
      <h2 className="mb-12 text-3xl font-extrabold tracking-tight sm:text-4xl">
        From domain to sale in minutes.
      </h2>
      <div className="grid gap-8 sm:grid-cols-3 lg:grid-cols-5">
        {workflowSteps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="relative">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-tint">
                  <Icon className="h-5 w-5 text-primary-deep" />
                </span>
                {i < workflowSteps.length - 1 && (
                  <ArrowRight className="hidden h-4 w-4 text-border lg:block" />
                )}
              </div>
              <p className="text-xs font-bold text-muted-foreground">0{i + 1}</p>
              <h3 className="text-base font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

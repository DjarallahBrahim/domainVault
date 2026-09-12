import { SectionLabel } from "./shared";
import { features } from "./data";

export function FeaturesSection() {
  return (
    <section id="product" className="mx-auto max-w-7xl px-4 py-20">
      <div className="mb-12 text-center">
        <SectionLabel>Everything you need</SectionLabel>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          Powerful features for serious domain investors
        </h2>
      </div>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-lg"
            >
              <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-tint">
                <Icon className="h-5 w-5 text-primary-deep" />
              </span>
              <h3 className="text-base font-bold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

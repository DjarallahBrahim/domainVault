import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Domains",
};

export default function DomainsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-display">Domains</h1>
      <p className="text-text-muted mt-4">Domain management coming in Phase 2</p>
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sales",
};

export default function SalesPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-display">Sales</h1>
      <p className="text-text-muted mt-4">Sales tracking coming in Phase 4</p>
    </div>
  );
}

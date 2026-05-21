import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-display">Dashboard</h1>
      <p className="text-text-muted mt-4">Your analytics will appear here in Phase 3</p>
    </div>
  );
}

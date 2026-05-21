import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Import",
};

export default function ImportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold font-display">Import</h1>
      <p className="text-text-muted mt-4">CSV import coming in Phase 2</p>
    </div>
  );
}

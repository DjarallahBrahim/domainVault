import type { Metadata } from "next";
import { ImportLogList } from "@/components/history/import-log-list";
import Link from "next/link";
import { FileUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Import History",
};

export default function ImportHistoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display">Import History</h1>
        <Link
          href="/import"
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-accent-primary text-white text-sm font-medium hover:bg-accent-primary/90 transition-colors"
        >
          <FileUp className="h-4 w-4" />
          New Import
        </Link>
      </div>
      <ImportLogList />
    </div>
  );
}

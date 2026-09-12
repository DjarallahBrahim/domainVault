import type { Metadata } from "next";
import { ToolsView } from "@/components/tools/ToolsView";

export const metadata: Metadata = {
  title: "Tools",
};

interface ToolsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  const params = await searchParams;
  const tool = params.tool === "tld" ? "tld" : "dns";

  return <ToolsView initialTool={tool} />;
}

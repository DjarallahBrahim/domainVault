import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getJob } from "@/lib/supabase/queries/tld-jobs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { data, error } = await getJob(supabase, id, authData.user.id);

  if (error || !data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      id: data.id,
      status: data.status,
      totalPairs: data.total_pairs,
      processedPairs: data.processed_pairs,
      error: data.error,
      createdAt: data.created_at,
      startedAt: data.started_at,
      finishedAt: data.finished_at,
    },
  });
}

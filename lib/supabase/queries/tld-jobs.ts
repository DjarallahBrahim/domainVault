export interface CreateJobParams {
  userId: string;
  scope: string;
  domainIds: string[];
  totalPairs: number;
}

export interface TldCheckJobRow {
  id: string;
  user_id: string;
  scope: string;
  domain_ids: string[];
  status: string;
  total_pairs: number;
  processed_pairs: number;
  error: string | null;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
}

export async function createJob(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  params: CreateJobParams
) {
  const { data: existing } = await client
    .from("tld_check_jobs")
    .select("id, status")
    .eq("user_id", params.userId)
    .in("status", ["queued", "running"])
    .limit(1);

  if (existing?.[0]) {
    return {
      data: null,
      error: new Error("A sync job is already in progress"),
      conflict: true,
    };
  }

  const { data, error } = await client
    .from("tld_check_jobs")
    .insert({
      user_id: params.userId,
      scope: params.scope,
      domain_ids: params.domainIds,
      status: "queued",
      total_pairs: params.totalPairs,
      processed_pairs: 0,
    })
    .select()
    .single();

  return { data: data as TldCheckJobRow | null, error, conflict: false };
}

export async function getJob(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  jobId: string,
  userId: string
) {
  const { data, error } = await client
    .from("tld_check_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", userId)
    .single();

  return { data: data as TldCheckJobRow | null, error };
}

export async function updateJobStatus(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  jobId: string,
  updates: {
    status?: string;
    processed_pairs?: number;
    error?: string | null;
  }
) {
  const updateFields: Record<string, unknown> = {};

  if (updates.status) updateFields.status = updates.status;
  if (updates.processed_pairs !== undefined)
    updateFields.processed_pairs = updates.processed_pairs;
  if (updates.error !== undefined) updateFields.error = updates.error;

  if (updates.status === "running") {
    updateFields.started_at = new Date().toISOString();
  }

  if (
    updates.status === "completed" ||
    updates.status === "failed" ||
    updates.status === "cancelled"
  ) {
    updateFields.finished_at = new Date().toISOString();
  }

  const { data, error } = await client
    .from("tld_check_jobs")
    .update(updateFields)
    .eq("id", jobId)
    .select()
    .single();

  return { data: data as TldCheckJobRow | null, error };
}

export async function incrementProcessedPairs(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  jobId: string,
  delta: number
) {
  const { data: job, error: fetchError } = await client
    .from("tld_check_jobs")
    .select("processed_pairs")
    .eq("id", jobId)
    .single();

  if (fetchError || !job) return { error: fetchError };

  const newCount = (job.processed_pairs ?? 0) + delta;

  return updateJobStatus(client, jobId, { processed_pairs: newCount });
}

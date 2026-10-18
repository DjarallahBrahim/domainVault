import type { Database } from "@/types/supabase";

export type DomainRenewalRow = Database["public"]["Tables"]["domain_renewals"]["Row"];

export interface RenewalTarget {
  id: string;
  domain: string;
  expiration_date: string;
}

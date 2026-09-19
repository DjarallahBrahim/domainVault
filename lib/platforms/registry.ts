import { createClient } from "@/lib/supabase/client";
import { queryKeys } from "@/lib/query-keys";
import { deleteSedoListing } from "@/lib/supabase/queries/sedo-listings-client";
import { deleteSpaceshipListing } from "@/lib/supabase/queries/spaceship-listings-client";

/**
 * A marketplace a domain can be delisted from once it sells.
 *
 * To support a new platform, add one entry here — the removal prompt and
 * dialog iterate over this registry, so nothing else needs to change.
 */
export interface RemovablePlatform {
  id: string;
  label: string;
  /** API route that removes the listing at the provider. */
  endpoint: string;
  /** React Query key for this platform's mirrored listings (for invalidation). */
  queryKey: readonly unknown[];
  /** Whether the domain currently has a mirrored listing for this platform. */
  isListed: (domainId: string) => Promise<boolean>;
  /** Drops the local mirrored listing once the provider confirms removal. */
  clearLocal: (domainId: string) => Promise<void>;
}

async function hasListing(
  table: "sedo_listings" | "spaceship_listings",
  domainId: string
): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from(table)
    .select("id")
    .eq("domain_id", domainId)
    .maybeSingle();

  if (error) return false;
  return Boolean(data);
}

export const REMOVABLE_PLATFORMS: RemovablePlatform[] = [
  {
    id: "sedo",
    label: "Sedo",
    endpoint: "/api/sedo/delete",
    queryKey: queryKeys.sedoListings.all,
    isListed: (domainId) => hasListing("sedo_listings", domainId),
    clearLocal: deleteSedoListing,
  },
  {
    id: "spaceship",
    label: "Spaceship",
    endpoint: "/api/spaceship/delete",
    queryKey: queryKeys.spaceshipListings.all,
    isListed: (domainId) => hasListing("spaceship_listings", domainId),
    clearLocal: deleteSpaceshipListing,
  },
];

export interface RemovableDomain {
  id: string;
  domain: string;
}

/** Platforms (from the registry) where the domain has a mirrored listing. */
export async function fetchListedPlatforms(
  domainId: string
): Promise<RemovablePlatform[]> {
  const checks = await Promise.all(
    REMOVABLE_PLATFORMS.map(async (platform) =>
      (await platform.isListed(domainId)) ? platform : null
    )
  );

  return checks.filter((p): p is RemovablePlatform => p !== null);
}

export interface RemovePlatformOutcome {
  platform: RemovablePlatform;
  ok: boolean;
  error?: string;
}

async function removeFromPlatform(
  platform: RemovablePlatform,
  domain: RemovableDomain
): Promise<void> {
  const response = await fetch(platform.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domain: domain.domain }),
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string };

  if (!response.ok || body.error) {
    throw new Error(body.error ?? `Could not remove from ${platform.label}`);
  }

  await platform.clearLocal(domain.id);
}

/** Remove the domain from each platform, collecting per-platform outcomes. */
export async function removeDomainFromPlatforms(
  platforms: RemovablePlatform[],
  domain: RemovableDomain
): Promise<RemovePlatformOutcome[]> {
  return Promise.all(
    platforms.map(async (platform) => {
      try {
        await removeFromPlatform(platform, domain);
        return { platform, ok: true };
      } catch (err) {
        return {
          platform,
          ok: false,
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    })
  );
}

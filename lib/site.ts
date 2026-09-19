/**
 * Canonical public URL of the app.
 *
 * Auth emails (signup confirmation, password reset) must always link back to
 * the production domain — never to whatever host the browser happens to be on
 * (e.g. localhost during development). Override locally with
 * `NEXT_PUBLIC_SITE_URL=http://localhost:3000` if you want local links.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://dnfly.io"
).replace(/\/+$/, "");

/** Absolute URL of the auth callback route on the canonical domain. */
export function authCallbackUrl(next?: string): string {
  const url = `${SITE_URL}/auth/callback`;
  return next ? `${url}?next=${encodeURIComponent(next)}` : url;
}

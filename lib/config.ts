/**
 * App feature flags.
 *
 * `EMAIL_CONFIRMATION_REQUIRED` controls whether a new account must verify its
 * email before it can be used. It must stay in sync with the Supabase project
 * setting `Authentication → Providers → Email → "Confirm email"`:
 *
 *  - false (default) → new users are signed in straight after sign-up, no
 *    verification email is sent.
 *  - true            → users are sent to the "verify your email" screen and
 *    cannot sign in until they click the link.
 *
 * The app cannot override Supabase: if this is false but the Supabase toggle is
 * still ON, sign-in is still blocked until the address is confirmed. So turn
 * that toggle OFF when this is false.
 *
 * Override per environment with `NEXT_PUBLIC_EMAIL_CONFIRMATION_REQUIRED=true`.
 * TODO(admin): source this from an admin-controlled settings table instead of a
 * build-time constant.
 */
export const EMAIL_CONFIRMATION_REQUIRED =
  process.env.NEXT_PUBLIC_EMAIL_CONFIRMATION_REQUIRED === "true";

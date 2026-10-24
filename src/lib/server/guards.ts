import { error, redirect } from "@sveltejs/kit";

import type { SessionUser } from "./auth";

/** Require an authenticated user, redirecting to login otherwise. */
export function requireUser(
  user: SessionUser | null,
  redirectTo: string,
): SessionUser {
  if (!user)
    throw redirect(303, `/login?redirect=${encodeURIComponent(redirectTo)}`);
  return user;
}

/** Require a staff user (mirrors DRF IsAdminUser). */
export function requireStaff(
  user: SessionUser | null,
  redirectTo: string,
): SessionUser {
  const u = requireUser(user, redirectTo);
  if (!u.isStaff) throw error(403, "staff privileges required");
  return u;
}

import { requireStaff } from "#lib/server/guards.js";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  requireStaff(locals.user, "/real/accept");
  return {};
};

import { getAllEntries, statusLabel } from "#lib/server/db/repo.js";
import { requireStaff } from "#lib/server/guards.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  requireStaff(locals.user, "/entry/list");
  return {
    entries: getAllEntries().map((e) => ({
      ...e,
      label: statusLabel(e.status),
    })),
  };
};

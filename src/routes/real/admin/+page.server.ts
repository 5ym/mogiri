import { getPendingPays, getRecentReceivedPays } from "#lib/server/db/repo.js";
import { requireStaff } from "#lib/server/guards.js";
import { getOrderLines } from "#lib/server/orders.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  requireStaff(locals.user, "/real/admin");

  const orders = getRecentReceivedPays(3).map((r) => ({
    ...r,
    ...getOrderLines(r.userId),
  }));
  const pending = getPendingPays().map((r) => ({
    ...r,
    ...getOrderLines(r.userId),
  }));
  return { orders, pending };
};

import { redirect } from "@sveltejs/kit";
import { getOrderLines, getPay } from "#lib/server/orders.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, "/login?redirect=/pre/qr");
  }
  const pay = getPay(locals.user.id);
  if (!pay) {
    throw redirect(303, "/pre/pay");
  }
  return {
    email: locals.user.email,
    code: pay.code,
    method: pay.method,
    paid: pay.paid,
    received: pay.receive,
    order: getOrderLines(locals.user.id),
  };
};

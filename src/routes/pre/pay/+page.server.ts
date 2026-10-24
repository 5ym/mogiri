import { fail, redirect } from "@sveltejs/kit";
import { createPay } from "#lib/server/db/repo.js";
import { getOrderLines, getPay } from "#lib/server/orders.js";
import { isStripeConfigured } from "#lib/server/stripe.js";
import { randomCode } from "#lib/server/util.js";
import { PUBLIC_STRIPE_PUBLISHABLE_KEY } from "$app/env/public";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(303, "/login?redirect=/pre/pay");
  }
  if (getPay(locals.user.id)) {
    throw redirect(303, "/pre/qr");
  }

  const order = getOrderLines(locals.user.id);
  return {
    email: locals.user.email,
    order,
    stripeConfigured: isStripeConfigured(),
    publishableKey: PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  };
};

export const actions: Actions = {
  /**
   * 当日現金払い。Stripe を通さずに受け取り QR を発行する。支払いは受け取りのときに
   * スタッフが /real/confirm/[code] で受けて、支払い済みにする。
   */
  cash: async ({ locals }) => {
    if (!locals.user) throw redirect(303, "/login?redirect=/pre/pay");
    if (!getPay(locals.user.id)) {
      if (getOrderLines(locals.user.id).total <= 0) {
        return fail(400, { error: "注文内容が空です" });
      }
      createPay({
        userId: locals.user.id,
        token: "",
        code: randomCode(16),
        method: "cash",
        paid: false,
      });
    }
    throw redirect(303, "/pre/qr");
  },
};

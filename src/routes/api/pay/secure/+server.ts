import { error, json } from "@sveltejs/kit";
import { createPay } from "#lib/server/db/repo.js";
import { getPay } from "#lib/server/orders.js";
import { getStripe } from "#lib/server/stripe.js";
import { randomCode } from "#lib/server/util.js";
import type { RequestHandler } from "./$types";

/** Finalise a payment after a 3DS challenge (mirrors SecurePaySerializer). */
export const POST: RequestHandler = async ({ locals, request }) => {
  if (!locals.user) throw error(401, "authentication required");

  const stripe = getStripe();
  if (!stripe) throw error(503, "Stripe is not configured");

  // 支払い済みなら何もしない。当日現金払いで未払いの注文 (別のタブで選んだ等) は
  // カード決済に進め、通ったら createPay がカード決済で上書きする
  if (getPay(locals.user.id)?.paid) {
    return json({ ok: true });
  }

  const { token } = (await request.json()) as { token?: string };
  if (!token) throw error(400, "payment intent id required");

  const intent = await stripe.paymentIntents.retrieve(token);
  if (intent.status !== "succeeded") {
    throw error(400, "決済が完了していません");
  }

  createPay({
    userId: locals.user.id,
    token: intent.id,
    code: randomCode(16),
    method: "stripe",
    paid: true,
  });
  return json({ ok: true }, { status: 201 });
};

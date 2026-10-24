import { error, json } from "@sveltejs/kit";
import { parseSelections, priceSelections } from "#lib/order.js";
import { hashPassword } from "#lib/server/auth.js";
import {
  createPay,
  createUser,
  createUserProduct,
  getProductsByIds,
  transaction,
} from "#lib/server/db/repo.js";
import { requireStaff } from "#lib/server/guards.js";
import { randomCode } from "#lib/server/util.js";
import type { RequestHandler } from "./$types";

/**
 * Create a pseudo order for an in-person same-day purchase (mirrors the DRF
 * BuySerializer). Returns the QR/receipt code used as Square's request metadata.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
  requireStaff(locals.user, "/real/buy");

  const body = (await request.json().catch(() => null)) as {
    userproducts?: unknown;
  } | null;
  const selections = parseSelections(body?.userproducts);
  if (!selections || selections.length === 0)
    throw error(400, "選択内容をお確かめください");

  // 商品と種類が揃っているかを確かめ、今の価格をつける
  const priced = priceSelections(
    selections,
    getProductsByIds(selections.map((s) => s.product)),
  );
  if (!priced) throw error(400, "選択内容をお確かめください");

  const email = `info+${Date.now()}@mogiri.local`;
  const passwordHash = await hashPassword(randomCode(16));
  const code = randomCode(16);

  transaction(() => {
    const user = createUser({ email, passwordHash, isActive: true });
    for (const s of priced) {
      createUserProduct({
        userId: user.id,
        productId: s.product,
        variantId: s.variant,
        count: s.count,
        price: s.price,
      });
    }
    // Square で支払われると /real/square で支払い済み・受け取り済みになる
    createPay({
      userId: user.id,
      code,
      token: code,
      method: "square",
      paid: false,
    });
  });

  return json({ code }, { status: 201 });
};

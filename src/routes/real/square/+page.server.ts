import { getPayByCode, setPayReceived } from "#lib/server/db/repo.js";
import { requireStaff } from "#lib/server/guards.js";
import { isValidCode } from "#lib/validation.js";

import type { PageServerLoad } from "./$types";

/**
 * Square POS returns here after a charge. On success it includes
 * CLIENT_TRANSACTION_ID; we then mark the matching order as received.
 */
export const load: PageServerLoad = async ({ locals, url }) => {
  requireStaff(locals.user, "/real/square");

  const q = url.searchParams;
  const transactionId = q.get("com.squareup.pos.CLIENT_TRANSACTION_ID");
  const code = q.get("com.squareup.pos.REQUEST_METADATA") ?? "";

  if (!transactionId) {
    return {
      ok: false as const,
      message:
        q.get("com.squareup.pos.ERROR_DESCRIPTION") ??
        "決済がキャンセルされました",
    };
  }

  if (!isValidCode(code)) {
    return { ok: false as const, message: "不正なリクエストです" };
  }

  // 当日購入 (/api/buy) で作った注文だけを受け付ける。事前購入のコード (当日現金払いの
  // 未払い等) を渡されても、Square の決済と結びつかないので支払い済みにはしない
  const pay = getPayByCode(code);
  if (!pay || pay.method !== "square") {
    return { ok: false as const, message: "該当する注文が見つかりません" };
  }

  // Square で支払われたので、支払い済み・受け取り済みにする
  setPayReceived(pay.id, { pay: true });
  return { ok: true as const, message: "" };
};

import { error, fail } from "@sveltejs/kit";

import {
  getPayByCode,
  getUserById,
  setPayReceived,
} from "#lib/server/db/repo.js";
import { requireStaff } from "#lib/server/guards.js";
import { getOrderLines } from "#lib/server/orders.js";
import { isValidCode } from "#lib/validation.js";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, params }) => {
  requireStaff(locals.user, `/real/confirm/${params.code}`);
  if (!isValidCode(params.code)) throw error(404, "invalid code");

  const pay = getPayByCode(params.code);
  if (!pay) throw error(404, "order not found");

  const user = getUserById(pay.userId);
  return {
    code: params.code,
    received: pay.receive,
    method: pay.method,
    paid: pay.paid,
    email: user?.email ?? "",
    order: getOrderLines(pay.userId),
  };
};

/** 受け取りを確定する。`cash` は当日現金払いの代金を受けたことも一緒に記録する。 */
function receive(code: string, cash: boolean) {
  const pay = getPayByCode(code);
  if (!pay) return fail(404, { error: "不正なQRコードです" });
  if (pay.receive) return fail(409, { error: "受け取り済みのQRコードです" });
  if (cash) {
    if (pay.method !== "cash" || pay.paid) {
      return fail(400, { error: "当日現金払いの未払いの注文ではありません" });
    }
  } else if (!pay.paid) {
    return fail(400, { error: "支払いが済んでいない注文です" });
  }

  // 同時に確定されたときは片方だけが通る
  if (!setPayReceived(pay.id, { pay: cash })) {
    return fail(409, { error: "受け取り済みのQRコードです" });
  }
  return { success: true };
}

export const actions: Actions = {
  confirm: async ({ locals, params }) => {
    requireStaff(locals.user, `/real/confirm/${params.code}`);
    return receive(params.code, false);
  },
  cash: async ({ locals, params }) => {
    requireStaff(locals.user, `/real/confirm/${params.code}`);
    return receive(params.code, true);
  },
};

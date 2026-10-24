import { error, fail } from "@sveltejs/kit";

import {
  getEntryBySecret,
  statusLabel,
  updateEntryStatus,
} from "#lib/server/db/repo.js";
import { requireStaff } from "#lib/server/guards.js";

import type { Actions, PageServerLoad } from "./$types";

/**
 * ログイン後に戻す先。action の `/toggle` は付けず、シークレットだけ残す
 * (付けたまま戻すと、ログイン直後の画面の URL に `/toggle` が残る)。
 * フォームは `?secret=…&/toggle` に送るので、action でも URL から secret が取れる。
 */
function backTo(url: URL): string {
  const secret = url.searchParams.get("secret");
  return secret
    ? `/entry/status?secret=${encodeURIComponent(secret)}`
    : "/entry/status";
}

/** 入場 QR の読み取り先。スタッフが支払・入場のステータスを切り替える。 */
export const load: PageServerLoad = async ({ locals, url }) => {
  requireStaff(locals.user, backTo(url));
  const secret = url.searchParams.get("secret");
  if (!secret) throw error(400, "シークレットがありません");
  const entry = getEntryBySecret(secret);
  if (!entry) throw error(404, "登録が見つかりません");
  return { entry: { ...entry, label: statusLabel(entry.status) } };
};

export const actions: Actions = {
  /** pay / entry はトグル、pe は両方を立てる。 */
  toggle: async ({ locals, request, url }) => {
    requireStaff(locals.user, backTo(url));
    const form = await request.formData();
    const secret = String(form.get("secret") ?? "");
    const action = String(form.get("action") ?? "");
    if (action !== "pay" && action !== "entry" && action !== "pe") {
      return fail(400, { error: "操作が正しくありません" });
    }
    if (!updateEntryStatus(secret, action))
      return fail(404, { error: "登録が見つかりません" });
    return { success: true };
  },
};

import { fail } from "@sveltejs/kit";
import { createEntry, getEntryBySecret } from "#lib/server/db/repo.js";
import type { Actions } from "./$types";

/** 入場受付 (来場者向け)。アカウントは作らず、名前・連絡先・住所からシークレットを発行する。 */
export const actions: Actions = {
  /** 新規登録: name/contact/address を受け取り、シークレットを発行する。 */
  register: async ({ request }) => {
    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const contact = String(form.get("contact") ?? "").trim();
    const address = String(form.get("address") ?? "").trim();
    if (
      !name ||
      !contact ||
      !address ||
      [name, contact, address].some((v) => v.length > 255)
    ) {
      return fail(400, { error: "全ての項目を255文字以内で入力してください" });
    }
    const entry = createEntry({ name, contact, address });
    return { secret: entry.secret };
  },

  /** 再表示: 既存のシークレットを確かめて QR を出し直す。 */
  reissue: async ({ request }) => {
    const form = await request.formData();
    const secret = String(form.get("secret") ?? "").trim();
    if (!secret || !getEntryBySecret(secret)) {
      return fail(404, { reissueError: "シークレットが見つかりません" });
    }
    return { secret };
  },
};

import { fail } from "@sveltejs/kit";
import { parseSelections, priceSelections } from "#lib/order.js";
import { hashPassword } from "#lib/server/auth.js";
import {
  createUser,
  createUserProduct,
  createVerify,
  getAllProducts,
  getProductsByIds,
  getUserByEmail,
  transaction,
} from "#lib/server/db/repo.js";
import { sendVerificationEmail } from "#lib/server/email.js";
import { randomCode } from "#lib/server/util.js";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  return { products: getAllProducts() };
};

/** フォームの `products` (JSON) を選択内容にする。形が崩れていれば null。 */
function readSelections(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") return null;
  try {
    return parseSelections(JSON.parse(raw));
  } catch {
    return null;
  }
}

export const actions: Actions = {
  register: async ({ request }) => {
    const form = await request.formData();
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const selections = readSelections(form.get("products"));

    if (!email) return fail(400, { error: "メールアドレスは必須です" });
    if (password.length < 8)
      return fail(400, { error: "パスワードは8文字以上でなければなりません" });
    if (!selections) return fail(400, { error: "選択内容をお確かめください" });
    if (selections.length === 0)
      return fail(400, { error: "商品を1つ以上選択してください" });

    if (getUserByEmail(email)) {
      return fail(400, { error: "このメールアドレスは既に登録されています" });
    }

    // 商品と種類が揃っているかを確かめ、今の価格をつける
    const priced = priceSelections(
      selections,
      getProductsByIds(selections.map((s) => s.product)),
    );
    if (!priced) return fail(400, { error: "選択内容をお確かめください" });

    const passwordHash = await hashPassword(password);
    const code = randomCode(16);

    transaction(() => {
      const user = createUser({ email, passwordHash, isActive: false });
      createVerify(user.id, code);
      for (const s of priced) {
        createUserProduct({
          userId: user.id,
          productId: s.product,
          variantId: s.variant,
          count: s.count,
          price: s.price,
        });
      }
    });

    await sendVerificationEmail(email, code);
    return { success: true };
  },
};

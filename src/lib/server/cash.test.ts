import { beforeAll, describe, expect, mock, test } from "bun:test";

// SvelteKit の外 (bun test) では `$app/env/*` が無いので、メモリ上の DB を指す値に差し替える。
// db はこれを読んで開くので、差し替えてから読み込む
mock.module("$app/env/private", () => ({
  DATABASE_URL: ":memory:",
  STRIPE_SECRET_KEY: undefined,
}));
mock.module("$app/env/public", () => ({
  PUBLIC_STRIPE_PUBLISHABLE_KEY: undefined,
}));

const { db } = await import("./db");
const repo = await import("./db/repo");
const { getOrderLines } = await import("./orders");
const prePay = await import("../../routes/pre/pay/+page.server");
const confirm = await import("../../routes/real/confirm/[code]/+page.server");

type Action = (event: unknown) => Promise<unknown>;
const staff = { id: 0, email: "staff@x", isStaff: true, isSuperuser: false };

let shirt: number;
let coffee: number;
let sizeM: number;

function order(email: string) {
  const user = repo.createUser({ email, passwordHash: "", isActive: true });
  repo.createUserProduct({
    userId: user.id,
    productId: coffee,
    variantId: null,
    count: 1,
    price: 500,
  });
  repo.createUserProduct({
    userId: user.id,
    productId: shirt,
    variantId: sizeM,
    count: 2,
    price: 2000,
  });
  return { id: user.id, email, isStaff: false, isSuperuser: false };
}

/** アクションを呼ぶ。redirect は投げられるので、その行き先を返す。 */
async function run(action: Action, event: unknown) {
  try {
    return await action(event);
  } catch (e) {
    if (e && typeof e === "object" && "location" in e)
      return { redirect: e.location };
    throw e;
  }
}

beforeAll(() => {
  coffee = (
    db
      .query(
        "INSERT INTO products (price, image, title) VALUES (500, '', 'コーヒー') RETURNING id",
      )
      .get() as {
      id: number;
    }
  ).id;
  shirt = (
    db
      .query(
        "INSERT INTO products (price, image, title) VALUES (2000, '', 'Tシャツ') RETURNING id",
      )
      .get() as {
      id: number;
    }
  ).id;
  const v = db.query(
    "INSERT INTO product_variants (product_id, name, sort) VALUES (?, ?, ?) RETURNING id",
  );
  v.get(shirt, "S", 0);
  sizeM = (v.get(shirt, "M", 1) as { id: number }).id;
});

describe("種類つきの注文", () => {
  test("商品一覧に種類がつき、明細に種類名が出る", () => {
    const products = repo.getAllProducts();
    expect(
      products.find((p) => p.id === shirt)?.variants.map((v) => v.name),
    ).toEqual(["S", "M"]);
    expect(products.find((p) => p.id === coffee)?.variants).toEqual([]);

    const user = order("lines@x");
    const { lines, total } = getOrderLines(user.id);
    expect(lines.map((l) => [l.title, l.variant, l.count, l.subtotal])).toEqual(
      [
        ["コーヒー", null, 1, 500],
        ["Tシャツ", "M", 2, 4000],
      ],
    );
    expect(total).toBe(4500);
  });
});

describe("当日現金払い", () => {
  test("Stripe を通さずに未払いの受け取り QR を発行する (二度押しでも 1 つ)", async () => {
    const user = order("cash@x");
    const cash = prePay.actions.cash as Action;
    expect(await run(cash, { locals: { user } })).toEqual({
      redirect: "/pre/qr",
    });
    const pay = repo.getPayByUser(user.id)!;
    expect(pay).toMatchObject({ method: "cash", paid: false, receive: false });
    expect(pay.code).toMatch(/^[A-Za-z0-9]{16}$/);

    expect(await run(cash, { locals: { user } })).toEqual({
      redirect: "/pre/qr",
    });
    expect(repo.getPayByUser(user.id)?.code).toBe(pay.code);
  });

  test("注文が空なら発行しない", async () => {
    const user = repo.createUser({
      email: "empty@x",
      passwordHash: "",
      isActive: true,
    });
    const result = await run(prePay.actions.cash as Action, {
      locals: { user },
    });
    expect(result).toMatchObject({ status: 400 });
    expect(repo.getPayByUser(user.id)).toBeNull();
  });

  test("スタッフが代金を受けると支払い済み・受け取り済みになる", async () => {
    const user = order("cash-confirm@x");
    await run(prePay.actions.cash as Action, { locals: { user } });
    const { code } = repo.getPayByUser(user.id)!;
    const event = { locals: { user: staff }, params: { code } };

    // 未払いのままの「確定」は通さない
    expect(await run(confirm.actions.confirm as Action, event)).toMatchObject({
      status: 400,
    });
    expect(repo.getPayByUser(user.id)?.receive).toBe(false);

    expect(await run(confirm.actions.cash as Action, event)).toEqual({
      success: true,
    });
    expect(repo.getPayByUser(user.id)).toMatchObject({
      paid: true,
      receive: true,
    });

    // 二度目は受け取り済み
    expect(await run(confirm.actions.cash as Action, event)).toMatchObject({
      status: 409,
    });
  });

  test("支払い済みの注文に現金の受け取りは使えない", async () => {
    const user = order("card@x");
    repo.createPay({
      userId: user.id,
      token: "pi_1",
      code: "CardCard12345678",
      method: "stripe",
      paid: true,
    });
    const event = {
      locals: { user: staff },
      params: { code: "CardCard12345678" },
    };
    expect(await run(confirm.actions.cash as Action, event)).toMatchObject({
      status: 400,
    });
    expect(await run(confirm.actions.confirm as Action, event)).toEqual({
      success: true,
    });
    expect(repo.getPayByUser(user.id)).toMatchObject({
      method: "stripe",
      paid: true,
      receive: true,
    });
  });

  test("現金払いの後にカード決済が通ったらカード決済で上書きし、逆は上書きしない", () => {
    const user = order("switch@x");
    repo.createPay({
      userId: user.id,
      token: "",
      code: "Switch1234567890",
      method: "cash",
      paid: false,
    });
    repo.createPay({
      userId: user.id,
      token: "pi_2",
      code: "Other12345678901",
      method: "stripe",
      paid: true,
    });
    expect(repo.getPayByUser(user.id)).toMatchObject({
      code: "Switch1234567890",
      method: "stripe",
      paid: true,
    });
    repo.createPay({
      userId: user.id,
      token: "",
      code: "Other12345678902",
      method: "cash",
      paid: false,
    });
    expect(repo.getPayByUser(user.id)).toMatchObject({
      method: "stripe",
      paid: true,
    });
  });

  test("管理画面の受け取り待ちに支払い方法と状態が出る", async () => {
    const user = order("pending@x");
    await run(prePay.actions.cash as Action, { locals: { user } });
    const pending = repo.getPendingPays().find((p) => p.email === "pending@x");
    expect(pending).toMatchObject({ method: "cash", paid: false });
    expect(
      repo.getPendingPays().some((p) => p.email === "cash-confirm@x"),
    ).toBe(false);
    expect(
      repo.getRecentReceivedPays(10).find((p) => p.email === "cash-confirm@x"),
    ).toMatchObject({
      method: "cash",
      paid: true,
    });
  });
});

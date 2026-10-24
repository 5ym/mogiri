/**
 * 注文の選択内容 (商品・種類・数量) の扱い。画面 (ProductPicker) とサーバーの両方で使うので、
 * サーバー専用のモジュールには依存しない。
 */
import type { CatalogProduct, PayMethod } from "#lib/server/db/schema.js";

/** 1 つの商品 (種類) で選べる数量の上限。 */
export const MAX_COUNT = 99;

/** 支払い方法の表示名。 */
export const PAY_METHOD_LABELS: Record<PayMethod, string> = {
  stripe: "カード決済",
  cash: "当日現金払い",
  square: "当日購入",
};

/** 選択内容の 1 行。種類の無い商品は `variant` が null。 */
export type Selection = {
  product: number;
  variant: number | null;
  count: number;
};

/** 価格を確かめた注文明細 (`user_products` に書く値)。 */
export type PricedSelection = Selection & { price: number };

/** 画面で数量を持つときのキー。種類の無い商品は商品 ID だけ、種類があれば `商品:種類`。 */
export function selectionKey(product: number, variant: number | null): string {
  return variant === null ? String(product) : `${product}:${variant}`;
}

/** 画面の数量 (`selectionKey` → 数量) を選択内容にする。0 個のものは落とす。 */
export function countsToSelections(
  counts: Record<string, number>,
): Selection[] {
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([key, count]) => {
      const [product, variant] = key.split(":");
      return {
        product: Number(product),
        variant: variant === undefined ? null : Number(variant),
        count,
      };
    });
}

/** 画面の数量から合計金額を出す (価格は商品単位)。 */
export function countsTotal(
  products: CatalogProduct[],
  counts: Record<string, number>,
): number {
  const priceById = new Map(products.map((p) => [p.id, p.price]));
  return countsToSelections(counts).reduce(
    (sum, s) => sum + (priceById.get(s.product) ?? 0) * s.count,
    0,
  );
}

const isId = (v: unknown): v is number =>
  Number.isInteger(v) && (v as number) > 0;

/**
 * 送られてきた選択内容 (JSON を解いたもの) を形だけ確かめる。形が崩れていれば null。
 * 0 個の行は落とし、同じ商品・種類の行は数量を足し合わせる。
 */
export function parseSelections(raw: unknown): Selection[] | null {
  if (!Array.isArray(raw)) return null;
  const merged = new Map<string, Selection>();
  for (const item of raw) {
    if (typeof item !== "object" || item === null) return null;
    const { product, variant = null, count } = item as Record<string, unknown>;
    if (!isId(product) || !(variant === null || isId(variant))) return null;
    if (!Number.isInteger(count) || (count as number) < 0) return null;
    if (count === 0) continue;
    const key = selectionKey(product, variant);
    const total = (merged.get(key)?.count ?? 0) + (count as number);
    if (total > MAX_COUNT) return null;
    merged.set(key, { product, variant, count: total });
  }
  return [...merged.values()];
}

/**
 * 選択内容を商品の一覧と突き合わせ、今の価格をつけて返す。
 * 無い商品、種類のある商品で種類が無い・違う商品の種類、種類の無い商品に種類がある、の
 * どれかがあれば null。
 */
export function priceSelections(
  selections: Selection[],
  products: CatalogProduct[],
): PricedSelection[] | null {
  const byId = new Map(products.map((p) => [p.id, p]));
  const priced: PricedSelection[] = [];
  for (const s of selections) {
    const product = byId.get(s.product);
    if (!product) return null;
    const ok =
      product.variants.length === 0
        ? s.variant === null
        : product.variants.some((v) => v.id === s.variant);
    if (!ok) return null;
    priced.push({ ...s, price: product.price });
  }
  return priced;
}

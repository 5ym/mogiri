import { db } from "./db";
import { getPayByUser } from "./db/repo";

export type OrderLine = {
  /** 明細 (`user_products`) の ID。同じ商品が種類違いで複数行になるので、行の識別に使う。 */
  key: number;
  /** 商品 ID。 */
  id: number;
  title: string;
  /** 種類の名前。種類の無い商品は null。 */
  variant: string | null;
  price: number;
  count: number;
  subtotal: number;
};

export type Order = {
  lines: OrderLine[];
  total: number;
};

/** Load a user's ordered line items joined with product info. */
export function getOrderLines(userId: number): Order {
  const rows = db
    .query(
      `SELECT up.id AS "key", p.id AS id, p.title AS title, v.name AS variant,
			 up.price AS price, up.count AS count
			 FROM user_products up
			 JOIN products p ON p.id = up.product_id
			 LEFT JOIN product_variants v ON v.id = up.variant_id
			 WHERE up.user_id = ?
			 ORDER BY p.id, v.sort, v.id, up.id`,
    )
    .all(userId) as Omit<OrderLine, "subtotal">[];

  const lines: OrderLine[] = rows.map((r) => ({
    ...r,
    subtotal: r.price * r.count,
  }));
  const total = lines.reduce((sum, l) => sum + l.subtotal, 0);
  return { lines, total };
}

export function getPay(userId: number) {
  return getPayByUser(userId);
}

export function calcAmount(userId: number): number {
  return getOrderLines(userId).total;
}

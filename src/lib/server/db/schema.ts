// Plain row types for the SQLite tables. The table definitions themselves live
// in `ddl.ts` (raw SQL, applied on startup). Column flags stored as SQLite
// integers (0/1) are exposed here as booleans by the query helpers in `repo.ts`.

export interface User {
  id: number;
  email: string;
  passwordHash: string;
  isActive: boolean;
  isStaff: boolean;
  isSuperuser: boolean;
  createdAt: string;
}

export interface Product {
  id: number;
  price: number;
  image: string;
  title: string;
  desc: string;
}

/** 商品の種類 (サイズ・色など)。 */
export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sort: number;
}

/** 種類つきの商品。種類が無い商品は `variants` が空。 */
export interface CatalogProduct extends Product {
  variants: { id: number; name: string }[];
}

export interface UserProduct {
  id: number;
  userId: number;
  productId: number;
  count: number;
  price: number;
  variantId: number | null;
}

export interface Pay {
  id: number;
  userId: number;
  token: string;
  code: string;
  receive: boolean;
  updatedAt: string;
  method: PayMethod;
  paid: boolean;
}

/** 支払い方法。表示名は `src/lib/order.ts` の `PAY_METHOD_LABELS`。 */
export type PayMethod = "stripe" | "cash" | "square";

/** 入場受付の登録。`status` はビットフラグ (`STATUS_ENTRY` / `STATUS_PAID`、repo.ts)。 */
export interface Entry {
  id: number;
  name: string;
  contact: string;
  address: string;
  secret: string;
  status: number;
  createdAt: string;
}

import type { Database } from "bun:sqlite";

/**
 * Idempotent schema bootstrap — the single source of truth for the table
 * layout (the row types in `schema.ts` mirror it). Running it on startup means
 * the app works with a fresh SQLite file without a separate migration step.
 */
export const DDL = `
CREATE TABLE IF NOT EXISTS users (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	email TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	is_active INTEGER NOT NULL DEFAULT 0,
	is_staff INTEGER NOT NULL DEFAULT 0,
	is_superuser INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS verifies (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
	code TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	price INTEGER NOT NULL,
	image TEXT NOT NULL,
	title TEXT NOT NULL,
	desc TEXT NOT NULL DEFAULT ''
);

-- 商品の種類 (サイズ・色など)。種類を持つ商品は、注文のときに種類ごとに数量を選ぶ。
-- 価格は商品単位 (products.price)。sort の小さい順に並べる。
CREATE TABLE IF NOT EXISTS product_variants (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	name TEXT NOT NULL,
	sort INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS product_variants_product_idx ON product_variants(product_id, sort, id);

CREATE TABLE IF NOT EXISTS user_products (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	count INTEGER NOT NULL,
	price INTEGER NOT NULL,
	variant_id INTEGER REFERENCES product_variants(id)
);

CREATE TABLE IF NOT EXISTS pays (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
	token TEXT NOT NULL,
	code TEXT NOT NULL,
	receive INTEGER NOT NULL DEFAULT 0,
	updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
	-- 支払い方法 (stripe = 事前のカード決済, cash = 当日現金払い, square = 当日購入)
	method TEXT NOT NULL DEFAULT 'stripe',
	-- 支払い済みか。当日現金払いと当日購入は、受け取りのときに支払われて 1 になる
	paid INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
	id TEXT PRIMARY KEY,
	user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
	expires_at INTEGER NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id, id);

-- 入場受付 (/entry)。来場者はアカウントを持たず、secret (9 桁) で本人を引く。
-- status はビットフラグ (1 = 入場済, 2 = 支払済)。
CREATE TABLE IF NOT EXISTS entries (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	name TEXT NOT NULL,
	contact TEXT NOT NULL,
	address TEXT NOT NULL,
	secret TEXT NOT NULL UNIQUE,
	status INTEGER NOT NULL DEFAULT 0,
	created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);
`;

/**
 * 後から足した列。`CREATE TABLE IF NOT EXISTS` は既にあるテーブルを触らないので、
 * 古い DB には無い列だけを `ALTER TABLE … ADD COLUMN` で足す (何度流しても同じ結果になる)。
 * 定義は上の `CREATE TABLE` と揃えること。
 */
const ADDED_COLUMNS: { table: string; column: string; definition: string }[] = [
  {
    table: "user_products",
    column: "variant_id",
    definition: "INTEGER REFERENCES product_variants(id)",
  },
  {
    table: "pays",
    column: "method",
    definition: "TEXT NOT NULL DEFAULT 'stripe'",
  },
  { table: "pays", column: "paid", definition: "INTEGER NOT NULL DEFAULT 1" },
];

function hasColumn(sqlite: Database, table: string, column: string): boolean {
  const columns = sqlite.query(`PRAGMA table_info(${table})`).all() as {
    name: string;
  }[];
  return columns.some((c) => c.name === column);
}

export function ensureSchema(sqlite: Database): void {
  sqlite.transaction(() => {
    sqlite.exec(DDL);
    const added = new Set<string>();
    for (const { table, column, definition } of ADDED_COLUMNS) {
      if (hasColumn(sqlite, table, column)) continue;
      sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
      added.add(`${table}.${column}`);
    }
    // 列を足す前の当日購入 (/api/buy) は token に code を入れていた。既定の stripe・支払い済み
    // のままだと誤るので、Square から戻って受け取り済みになったものだけを支払い済みにする
    if (added.has("pays.method")) {
      sqlite.exec(
        "UPDATE pays SET method = 'square', paid = receive WHERE token = code",
      );
    }
  })();
}

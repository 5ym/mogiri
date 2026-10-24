import { Database } from "bun:sqlite";
import { describe, expect, test } from "bun:test";
import { ensureSchema } from "./ddl";

const columns = (db: Database, table: string) =>
  (db.query(`PRAGMA table_info(${table})`).all() as { name: string }[]).map(
    (c) => c.name,
  );

describe("ensureSchema", () => {
  test("新しい DB に後から足した列ごと作る (何度流しても同じ)", () => {
    const db = new Database(":memory:");
    ensureSchema(db);
    ensureSchema(db);
    expect(columns(db, "user_products")).toContain("variant_id");
    expect(columns(db, "pays")).toEqual(
      expect.arrayContaining(["method", "paid"]),
    );
    expect(columns(db, "product_variants")).toEqual([
      "id",
      "product_id",
      "name",
      "sort",
    ]);
  });

  test("列を足す前の DB に列を足し、当日購入の行を square に直す", () => {
    const db = new Database(":memory:");
    // 列を足す前のテーブル
    db.exec(`
			CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE,
				password_hash TEXT NOT NULL, is_active INTEGER NOT NULL DEFAULT 0,
				is_staff INTEGER NOT NULL DEFAULT 0, is_superuser INTEGER NOT NULL DEFAULT 0,
				created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP));
			CREATE TABLE products (id INTEGER PRIMARY KEY AUTOINCREMENT, price INTEGER NOT NULL,
				image TEXT NOT NULL, title TEXT NOT NULL, desc TEXT NOT NULL DEFAULT '');
			CREATE TABLE user_products (id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
				product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
				count INTEGER NOT NULL, price INTEGER NOT NULL);
			CREATE TABLE pays (id INTEGER PRIMARY KEY AUTOINCREMENT,
				user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
				token TEXT NOT NULL, code TEXT NOT NULL, receive INTEGER NOT NULL DEFAULT 0,
				updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP));
			INSERT INTO users (id, email, password_hash) VALUES (1, 'a@x', ''), (2, 'b@x', ''), (3, 'c@x', '');
			INSERT INTO products (id, price, image, title) VALUES (1, 500, '', 'コーヒー');
			INSERT INTO user_products (user_id, product_id, count, price) VALUES (1, 1, 2, 500);
			INSERT INTO pays (user_id, token, code, receive) VALUES
				(1, 'pi_123', 'AAAAAAAAAAAAAAAA', 0),
				(2, 'BBBBBBBBBBBBBBBB', 'BBBBBBBBBBBBBBBB', 1),
				(3, 'CCCCCCCCCCCCCCCC', 'CCCCCCCCCCCCCCCC', 0);
		`);

    ensureSchema(db);
    ensureSchema(db);

    expect(columns(db, "user_products")).toContain("variant_id");
    expect(db.query("SELECT variant_id AS v FROM user_products").get()).toEqual(
      { v: null },
    );
    expect(
      db.query("SELECT user_id, method, paid FROM pays ORDER BY user_id").all(),
    ).toEqual([
      { user_id: 1, method: "stripe", paid: 1 },
      { user_id: 2, method: "square", paid: 1 },
      { user_id: 3, method: "square", paid: 0 },
    ]);
  });
});

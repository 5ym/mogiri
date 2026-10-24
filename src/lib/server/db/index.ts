import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DATABASE_URL } from "$app/env/private";
import { ensureSchema } from "./ddl";

const url = DATABASE_URL;

// Make sure the directory for a file-backed database exists.
if (url !== ":memory:") {
  mkdirSync(dirname(url), { recursive: true });
}

export const db = new Database(url, { create: true });
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
ensureSchema(db);

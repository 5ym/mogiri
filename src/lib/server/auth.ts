import type { RequestEvent } from "@sveltejs/kit";
import { db } from "./db";

export const SESSION_COOKIE = "session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export type SessionUser = {
  id: number;
  email: string;
  isStaff: boolean;
  isSuperuser: boolean;
};

type SessionUserRow = {
  id: number;
  email: string;
  isStaff: number;
  isSuperuser: number;
  expiresAt: number;
};

export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, "argon2id");
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    return await Bun.password.verify(password, hash);
  } catch {
    return false;
  }
}

/** Create a session row and return its opaque id (stored in the cookie). */
export function createSession(userId: number): string {
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  db.query(
    "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(id, userId, expiresAt);
  return id;
}

/** Look up the user behind a session id, clearing the session if expired. */
export function validateSession(sessionId: string): SessionUser | null {
  const row = db
    .query(
      `SELECT u.id AS id, u.email AS email, u.is_staff AS isStaff,
			        u.is_superuser AS isSuperuser, s.expires_at AS expiresAt
			 FROM sessions s JOIN users u ON u.id = s.user_id
			 WHERE s.id = ?`,
    )
    .get(sessionId) as SessionUserRow | null;

  if (!row) return null;
  if (row.expiresAt < Date.now()) {
    deleteSession(sessionId);
    return null;
  }
  return {
    id: row.id,
    email: row.email,
    isStaff: Boolean(row.isStaff),
    isSuperuser: Boolean(row.isSuperuser),
  };
}

export function deleteSession(sessionId: string): void {
  db.query("DELETE FROM sessions WHERE id = ?").run(sessionId);
}

export function setSessionCookie(event: RequestEvent, sessionId: string): void {
  event.cookies.set(SESSION_COOKIE, sessionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: !import.meta.env.DEV,
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export function clearSessionCookie(event: RequestEvent): void {
  event.cookies.delete(SESSION_COOKIE, { path: "/" });
}

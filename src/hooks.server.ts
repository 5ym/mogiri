import type { Handle } from "@sveltejs/kit/hooks";

import { SESSION_COOKIE, validateSession } from "#lib/server/auth.js";

export const handle: Handle = async ({ event, resolve }) => {
  const sessionId = event.cookies.get(SESSION_COOKIE);
  event.locals.user = sessionId ? validateSession(sessionId) : null;
  return resolve(event);
};

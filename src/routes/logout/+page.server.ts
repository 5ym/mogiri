import { redirect } from "@sveltejs/kit";
import {
  clearSessionCookie,
  deleteSession,
  SESSION_COOKIE,
} from "#lib/server/auth.js";
import type { Actions } from "./$types";

export const actions: Actions = {
  default: async (event) => {
    const sessionId = event.cookies.get(SESSION_COOKIE);
    if (sessionId) deleteSession(sessionId);
    clearSessionCookie(event);
    throw redirect(303, "/");
  },
};

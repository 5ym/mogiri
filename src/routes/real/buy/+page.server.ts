import {
  PUBLIC_SQUARE_APPLICATION_ID,
  PUBLIC_SQUARE_CALLBACK_URL,
} from "$app/env/public";

import { getAllProducts } from "#lib/server/db/repo.js";
import { requireStaff } from "#lib/server/guards.js";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  requireStaff(locals.user, "/real/buy");
  return {
    products: getAllProducts(),
    square: {
      applicationId: PUBLIC_SQUARE_APPLICATION_ID ?? "",
      callbackUrl: PUBLIC_SQUARE_CALLBACK_URL ?? "",
    },
  };
};

import {
  activateUser,
  deleteVerify,
  getVerifyByCode,
  transaction,
} from "#lib/server/db/repo.js";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const verify = getVerifyByCode(params.code);

  if (!verify) {
    // Unknown/already-consumed code: original behaviour forwards to the pay page.
    return { status: "notfound" as const };
  }

  transaction(() => {
    activateUser(verify.userId);
    deleteVerify(verify.id);
  });

  return { status: "verified" as const };
};

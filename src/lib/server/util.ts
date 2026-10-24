const ALPHANUMERIC =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Generate a cryptographically-random alphanumeric string (default 16 chars). */
export function randomCode(length = 16): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHANUMERIC[bytes[i] % ALPHANUMERIC.length];
  }
  return out;
}

/** The QR payload is a 16-char alphanumeric string; validate that shape. */
export function isValidCode(code: string): boolean {
  return /^[A-Za-z0-9]{16}$/.test(code);
}

/**
 * 入場 QR (`<origin>/entry/status?secret=123456789`) を読んだとき、自分の画面の道
 * (`/entry/status?secret=…`) を返す。入場 QR でなければ null。
 * 発行したときの origin と読み取る端末の origin が違っても通すよう、道とシークレットだけを見る。
 */
export function entryStatusPath(text: string): string | null {
  // ブラウザで動くので、まだ新しい `URL.parse` ではなく `new URL` で解く
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.pathname !== "/entry/status") return null;
  const secret = url.searchParams.get("secret") ?? "";
  return /^\d{9}$/.test(secret) ? `/entry/status?secret=${secret}` : null;
}

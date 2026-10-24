import { describe, expect, test } from "bun:test";
import { entryStatusPath, isValidCode } from "./validation";

describe("entryStatusPath", () => {
  test("入場 QR の URL なら自分の道を返す (origin は問わない)", () => {
    expect(
      entryStatusPath("https://example.com/entry/status?secret=123456789"),
    ).toBe("/entry/status?secret=123456789");
    expect(
      entryStatusPath(
        "http://localhost:3000/entry/status?secret=123456789&x=1",
      ),
    ).toBe("/entry/status?secret=123456789");
  });

  test("入場 QR でなければ null", () => {
    for (const text of [
      "AbCdEfGh12345678", // 受け取り QR
      "/entry/status?secret=123456789", // URL でない
      "https://example.com/entry/status?secret=12345678", // 8 桁
      "https://example.com/entry/status?secret=12345678x",
      "https://example.com/entry/status",
      "https://example.com/entry/statusx?secret=123456789",
      "",
    ]) {
      expect(entryStatusPath(text)).toBeNull();
    }
  });
});

describe("isValidCode", () => {
  test("16 文字の英数字だけを通す", () => {
    expect(isValidCode("AbCdEfGh12345678")).toBe(true);
    expect(isValidCode("AbCdEfGh1234567")).toBe(false);
    expect(
      isValidCode("https://example.com/entry/status?secret=123456789"),
    ).toBe(false);
  });
});

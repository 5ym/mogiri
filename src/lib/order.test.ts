import { describe, expect, test } from "bun:test";

import {
  countsToSelections,
  countsTotal,
  MAX_COUNT,
  parseSelections,
  priceSelections,
  selectionKey,
} from "./order";
import type { CatalogProduct } from "./server/db/schema";

const products: CatalogProduct[] = [
  { id: 1, price: 500, image: "", title: "コーヒー", desc: "", variants: [] },
  {
    id: 2,
    price: 2000,
    image: "",
    title: "Tシャツ",
    desc: "",
    variants: [
      { id: 10, name: "S" },
      { id: 11, name: "M" },
    ],
  },
];

describe("parseSelections", () => {
  test("種類の無い行・種類のある行を読み、0 個は落とす", () => {
    expect(
      parseSelections([
        { product: 1, count: 2 },
        { product: 2, variant: 10, count: 1 },
        { product: 2, variant: 11, count: 0 },
      ]),
    ).toEqual([
      { product: 1, variant: null, count: 2 },
      { product: 2, variant: 10, count: 1 },
    ]);
  });

  test("同じ商品・種類の行は数量を足す", () => {
    expect(
      parseSelections([
        { product: 2, variant: 10, count: 1 },
        { product: 2, variant: 10, count: 2 },
        { product: 2, variant: 11, count: 1 },
      ]),
    ).toEqual([
      { product: 2, variant: 10, count: 3 },
      { product: 2, variant: 11, count: 1 },
    ]);
  });

  test("形が崩れていれば null", () => {
    for (const raw of [
      null,
      "x",
      { product: 1, count: 1 },
      [null],
      [{ product: "1", count: 1 }],
      [{ product: 1, count: -1 }],
      [{ product: 1, count: 1.5 }],
      [{ product: 1, count: MAX_COUNT + 1 }],
      [
        { product: 1, count: MAX_COUNT },
        { product: 1, count: 1 },
      ],
      [{ product: 2, variant: "M", count: 1 }],
      [{ product: 2, variant: 0, count: 1 }],
    ]) {
      expect(parseSelections(raw)).toBeNull();
    }
  });
});

describe("priceSelections", () => {
  test("今の価格をつける (価格は商品単位)", () => {
    expect(
      priceSelections(
        [
          { product: 1, variant: null, count: 2 },
          { product: 2, variant: 11, count: 1 },
        ],
        products,
      ),
    ).toEqual([
      { product: 1, variant: null, count: 2, price: 500 },
      { product: 2, variant: 11, count: 1, price: 2000 },
    ]);
  });

  test("商品と種類が揃っていなければ null", () => {
    for (const s of [
      { product: 3, variant: null, count: 1 }, // 無い商品
      { product: 2, variant: null, count: 1 }, // 種類のある商品で種類が無い
      { product: 2, variant: 99, count: 1 }, // 無い種類
      { product: 1, variant: 10, count: 1 }, // 種類の無い商品に種類
    ]) {
      expect(priceSelections([s], products)).toBeNull();
    }
  });
});

describe("画面の数量", () => {
  test("キーから選択内容と合計を出す", () => {
    const counts = {
      [selectionKey(1, null)]: 2,
      [selectionKey(2, 10)]: 1,
      [selectionKey(2, 11)]: 0,
    };
    expect(countsToSelections(counts)).toEqual([
      { product: 1, variant: null, count: 2 },
      { product: 2, variant: 10, count: 1 },
    ]);
    expect(countsTotal(products, counts)).toBe(3000);
  });
});

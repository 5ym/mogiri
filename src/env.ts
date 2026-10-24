import { defineEnvVars } from "@sveltejs/kit/env";

/**
 * 実行時に読む環境変数 (`$app/env/private` / `$app/env/public`)。SvelteKit 3 は
 * ここで宣言したものしか読めない。どれも未設定で起動でき、該当機能だけが無効になる。
 * 空文字 (`.env.example` の `KEY=`) は未設定として扱う。
 *
 * `src/lib/server/db/seed.ts` は SvelteKit の外で動くので、ここを通さず `process.env` を読む。
 */

const optional = (value: string | undefined) => value || undefined;

export const variables = defineEnvVars({
  DATABASE_URL: {
    description: "SQLite ファイルのパス (既定 `./data/mogiri.db`)",
    schema: (value) => value || "./data/mogiri.db",
  },
  ACS_CONNECTION_STRING: {
    description:
      "Azure Communication Services の接続文字列 (endpoint + accesskey)",
    schema: optional,
  },
  ACS_ENDPOINT: {
    description: "ACS のエンドポイント (接続文字列の代わり)",
    schema: optional,
  },
  ACS_ACCESS_KEY: {
    description: "ACS のアクセスキー (接続文字列の代わり)",
    schema: optional,
  },
  ACS_SENDER_ADDRESS: {
    description: "メールの送信元アドレス",
    schema: optional,
  },
  STRIPE_SECRET_KEY: {
    description: "Stripe のシークレットキー",
    schema: optional,
  },

  PUBLIC_BASE_URL: {
    public: true,
    description: "公開 URL。メール確認リンクや Stripe の戻り先に使う",
    schema: optional,
  },
  PUBLIC_STRIPE_PUBLISHABLE_KEY: {
    public: true,
    description: "Stripe の公開可能キー",
    schema: optional,
  },
  PUBLIC_SQUARE_APPLICATION_ID: {
    public: true,
    description: "Square POS のアプリケーション ID",
    schema: optional,
  },
  PUBLIC_SQUARE_CALLBACK_URL: {
    public: true,
    description: "Square POS から戻る URL (`/real/square`)",
    schema: optional,
  },
});

<script lang="ts">
  import ProductPicker from "#lib/components/ProductPicker.svelte";
  import { countsToSelections, countsTotal } from "#lib/order.js";
  import { toasts } from "#lib/stores/toast.svelte.js";
  import { enhance } from "$app/forms";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  let counts = $state<Record<string, number>>({});
  let email = $state("");
  let password = $state("");
  let loading = $state(false);

  const selections = $derived(countsToSelections(counts));
  const total = $derived(countsTotal(data.products, counts));

  $effect(() => {
    if (form?.error) toasts.error("エラー", form.error);
  });
</script>

<svelte:head>
  <title>事前購入 · mogiri</title>
</svelte:head>

<form
  method="POST"
  action="?/register"
  use:enhance={({ formData, cancel }) => {
    if (!email || password.length < 8 || selections.length === 0) {
      toasts.warning(
        "入力エラー",
        "メール・パスワード(8文字以上)・商品選択をご確認ください",
      );
      cancel();
      return;
    }
    formData.set("products", JSON.stringify(selections));
    loading = true;
    return async ({ update, result }) => {
      await update({ reset: false });
      loading = false;
      if (result.type === "success") {
        toasts.success(
          "送信完了",
          "メールを送信いたしました。メールをご確認ください。<br><a href='https://mail.google.com/'>Gmail</a>",
          8000,
        );
        counts = {};
        email = "";
        password = "";
      }
    };
  }}
>
  <h1>欲しい商品の数量を指定してください</h1>
  <ProductPicker products={data.products} bind:counts />

  <article>
    <h2>お客様情報</h2>
    <p>
      メールアドレスとパスワードを入力し、注文内容に誤りがなければ送信してください。
    </p>
    <p>
      <small>
        お支払い方法(カード決済・当日現金払い)は、メールアドレスの確認の後に選べます。
      </small>
    </p>
    <p>合計 <strong>{total.toLocaleString()}円</strong></p>
    <label>
      メールアドレス
      <input
        name="email"
        type="email"
        bind:value={email}
        maxlength="70"
        required
      />
    </label>
    <label>
      パスワード
      <input
        name="password"
        type="password"
        bind:value={password}
        minlength="8"
        maxlength="20"
        required
      />
    </label>
    <button type="submit" disabled={loading} aria-busy={loading}>送信</button>
  </article>
</form>

<script lang="ts">
  import { goto } from "$app/navigation";

  import ProductPicker from "#lib/components/ProductPicker.svelte";
  import { countsToSelections, countsTotal } from "#lib/order.js";
  import { toasts } from "#lib/stores/toast.svelte.js";

  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let counts = $state<Record<string, number>>({});
  let loading = $state(false);

  const total = $derived(countsTotal(data.products, counts));
  const selections = $derived(countsToSelections(counts));

  function buildSquareUrl(code: string): string {
    const tenderTypes =
      "com.squareup.pos.TENDER_CARD,com.squareup.pos.TENDER_CASH";
    return (
      "intent:#Intent;" +
      "action=com.squareup.pos.action.CHARGE;" +
      "package=com.squareup;" +
      `S.com.squareup.pos.WEB_CALLBACK_URI=${data.square.callbackUrl};` +
      `S.com.squareup.pos.CLIENT_ID=${data.square.applicationId};` +
      "S.com.squareup.pos.API_VERSION=v2.0;" +
      `i.com.squareup.pos.TOTAL_AMOUNT=${total};` +
      "S.com.squareup.pos.CURRENCY_CODE=JPY;" +
      `S.com.squareup.pos.TENDER_TYPES=${tenderTypes};` +
      "l.com.squareup.pos.AUTO_RETURN_TIMEOUT_MS=3200;" +
      `S.com.squareup.pos.REQUEST_METADATA=${code};` +
      "end"
    );
  }

  async function submit() {
    if (selections.length === 0) {
      toasts.warning("入力エラー", "商品を1つ以上選択してください");
      return;
    }
    loading = true;
    try {
      const res = await fetch("/api/buy", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userproducts: selections }),
      });
      if (res.ok) {
        const { code } = await res.json();
        window.open(buildSquareUrl(code));
      } else if (res.status === 401) {
        goto("/login?redirect=/real/buy");
      } else if (res.status === 403) {
        toasts.error("エラー", "権限がありません");
      } else {
        toasts.error("エラー", "選択内容をお確かめください");
      }
    } catch {
      toasts.error("エラー", "送信時にエラーが発生しました");
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>当日購入 · mogiri</title>
</svelte:head>

<h1>欲しい商品の数量を指定してください</h1>
<ProductPicker products={data.products} bind:counts />

<h2>合計 {total.toLocaleString()}円</h2>

<div class="grid">
  <a href="/real" role="button" class="outline">戻る</a>
  <button type="button" disabled={loading} aria-busy={loading} onclick={submit}
    >確定</button
  >
</div>

<script lang="ts">
  import { onMount } from "svelte";
  import OrderTable from "#lib/components/OrderTable.svelte";
  import PayStatus from "#lib/components/PayStatus.svelte";
  import { toasts } from "#lib/stores/toast.svelte.js";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let loading = $state(false);

  // 当日現金払いでまだ払われていない注文は、代金を受けてから渡す
  const cashDue = $derived(data.method === "cash" && !data.paid);

  onMount(() => {
    if (data.received) {
      toasts.warning(
        "受け取り済み",
        "受け取り済みのQRコードです。3秒後にQR読み込み画面に戻ります。",
      );
      setTimeout(() => goto("/real/accept"), 3000);
    }
  });

  $effect(() => {
    if (form?.error) toasts.error("エラー", form.error);
  });
</script>

<svelte:head>
  <title>受け取り確認 · mogiri</title>
</svelte:head>

<h1>注文内容をご確認ください</h1>

{#if cashDue && !data.received}
  <article>
    <header>当日現金払い・未払い</header>
    <p>お客様から現金で代金を受け取ってください。</p>
    <p class="amount"><strong>{data.order.total.toLocaleString()}円</strong></p>
  </article>
{:else if !data.paid && !data.received}
  <p><mark>支払いが済んでいない注文です。</mark></p>
{/if}

<article>
  <h2>{data.email}</h2>
  <p>
    <PayStatus method={data.method} paid={data.paid} />
    {#if data.received}
      <ins>受け取り済み</ins>
    {/if}
  </p>
  <OrderTable lines={data.order.lines} total={data.order.total} />
</article>

<div class="grid">
  <a href="/real/accept" role="button" class="outline">戻る</a>
  <form
    method="POST"
    action={cashDue ? "?/cash" : "?/confirm"}
    use:enhance={() => {
      loading = true;
      return async ({ update, result }) => {
        await update();
        loading = false;
        if (result.type === "success") {
          toasts.success(
            "Complete",
            "お買い上げありがとうございます。商品をお渡しします。5秒後にトップに戻ります。",
            5000,
          );
          setTimeout(() => goto("/real"), 5000);
        }
      };
    }}
  >
    <button
      type="submit"
      disabled={loading || data.received || (!data.paid && !cashDue)}
      aria-busy={loading}
    >
      {cashDue ? "支払いを受けて受け渡す" : "確定"}
    </button>
  </form>
</div>

<style>
  /* 現金で受け取る金額。離れていても読めるように大きく出す */
  .amount {
    font-size: 3rem;
  }
</style>

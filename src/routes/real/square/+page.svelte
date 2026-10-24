<script lang="ts">
  import { onMount } from "svelte";
  import { toasts } from "#lib/stores/toast.svelte.js";
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  onMount(() => {
    if (data.ok) {
      toasts.success(
        "Complete",
        "お買い上げありがとうございます。商品をお渡しします。5秒後にトップに戻ります。",
        5000,
      );
      setTimeout(() => goto("/real"), 5000);
    } else {
      toasts.error(
        "エラー",
        `${data.message}。3秒後に商品選択画面に戻ります。`,
      );
      setTimeout(() => goto("/real/buy"), 3000);
    }
  });
</script>

<svelte:head>
  <title>決済処理 · mogiri</title>
</svelte:head>

<p aria-busy="true">処理中...</p>

<script lang="ts">
  import { onMount } from "svelte";
  import { toasts } from "#lib/stores/toast.svelte.js";
  import { goto } from "$app/navigation";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  onMount(() => {
    if (data.status === "verified") {
      toasts.success(
        "確認完了",
        "メールアドレスの確認が完了しました。3秒後に支払画面に移動します。",
      );
    }
    const t = setTimeout(
      () => goto("/pre/pay"),
      data.status === "verified" ? 3000 : 0,
    );
    return () => clearTimeout(t);
  });
</script>

<svelte:head>
  <title>メール確認 · mogiri</title>
</svelte:head>

<p aria-busy="true">処理中...</p>

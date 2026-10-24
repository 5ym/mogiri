<script lang="ts">
  import { PAY_METHOD_LABELS } from "#lib/order.js";
  import type { PayMethod } from "#lib/server/db/schema.js";

  // 支払い方法と支払い状態。未払いは目立たせる
  let { method, paid }: { method: PayMethod; paid: boolean } = $props();
</script>

<!-- 支払い状態は <ins> / <mark> で色をつけるので、方法との区切りは空白だけにする -->
{PAY_METHOD_LABELS[method]}
{#if paid}
  <ins>支払い済み</ins>
{:else}
  <mark>未払い</mark>
{/if}

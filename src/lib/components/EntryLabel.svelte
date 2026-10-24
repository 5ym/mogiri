<script lang="ts">
  // 入場受付のステータス。3 = 支払済かつ入場済、0 = 未払い・未入場、それ以外は片方だけ済み
  let { entry }: { entry: { status: number; label: string } } = $props();
</script>

{#if entry.status === 3}
  <ins>{entry.label}</ins>
{:else if entry.status === 0}
  {entry.label}
{:else}
  <mark>{entry.label}</mark>
{/if}

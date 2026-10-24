<script lang="ts">
  import "@anyblades/blades/layered/content/table";
  import { refreshAll } from "$app/navigation";

  import OrderTable from "#lib/components/OrderTable.svelte";
  import PayStatus from "#lib/components/PayStatus.svelte";

  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();
  let loading = $state(false);

  // 受け取り待ちのうち、当日に現金で受け取る金額の合計
  const cashDue = $derived(
    data.pending.filter((o) => !o.paid).reduce((sum, o) => sum + o.total, 0),
  );

  async function refresh() {
    loading = true;
    await refreshAll();
    loading = false;
  }
</script>

<svelte:head>
  <title>管理 · mogiri</title>
</svelte:head>

<h1>最近の受け取り</h1>
<button
  type="button"
  class="outline"
  disabled={loading}
  aria-busy={loading}
  onclick={refresh}
>
  更新
</button>

{#if data.orders.length === 0}
  <p>受け取り済みの注文はありません。</p>
{/if}

{#each data.orders as order (order.userId)}
  <article>
    <h2>{order.email}</h2>
    <p><PayStatus method={order.method} paid={order.paid} /></p>
    <OrderTable lines={order.lines} total={order.total} />
  </article>
{/each}

<h2>受け取り待ち</h2>
{#if data.pending.length === 0}
  <p>受け取り待ちの注文はありません。</p>
{:else}
  <p>
    {data.pending.length}件。うち当日現金払いの未払いは合計
    <strong>{cashDue.toLocaleString()}円</strong>
  </p>
  <div class="overflow-auto">
    <table class="striped">
      <thead>
        <tr>
          <th>メールアドレス</th>
          <th>支払い</th>
          <th>注文内容</th>
          <th>合計</th>
        </tr>
      </thead>
      <tbody>
        {#each data.pending as order (order.userId)}
          <tr>
            <td>{order.email}</td>
            <td><PayStatus method={order.method} paid={order.paid} /></td>
            <td>
              {order.lines
                .map(
                  (l) =>
                    `${l.title}${l.variant ? ` (${l.variant})` : ""} ×${l.count}`,
                )
                .join("、")}
            </td>
            <td>{order.total.toLocaleString()}円</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}

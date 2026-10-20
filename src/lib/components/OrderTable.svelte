<script lang="ts">
import '@anyblades/blades/layered/content/table';
import type { OrderLine } from '#lib/server/orders.js';

let { lines, total }: { lines: OrderLine[]; total: number } = $props();

// 種類のある商品が含まれるときだけ「種類」の列を出す
const hasVariant = $derived(lines.some((l) => l.variant !== null));
</script>

<div class="overflow-auto">
	<table class="striped">
		<thead>
			<tr>
				<th>商品ID</th>
				<th>商品名</th>
				{#if hasVariant}
					<th>種類</th>
				{/if}
				<th>価格</th>
				<th>購入数</th>
				<th>小計</th>
			</tr>
		</thead>
		<tbody>
			{#each lines as line (line.key)}
				<tr>
					<td>{line.id}</td>
					<td>{line.title}</td>
					{#if hasVariant}
						<td>{line.variant ?? ''}</td>
					{/if}
					<td>{line.price.toLocaleString()}円</td>
					<td>{line.count}</td>
					<td>{line.subtotal.toLocaleString()}円</td>
				</tr>
			{/each}
		</tbody>
		<tfoot>
			<tr>
				<th colspan={hasVariant ? 5 : 4}>合計</th>
				<th>{total.toLocaleString()}円</th>
			</tr>
		</tfoot>
	</table>
</div>

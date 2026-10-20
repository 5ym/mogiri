<script lang="ts">
import '@anyblades/blades/layered/components/group';
import { MAX_COUNT, selectionKey } from '#lib/order.js';
import type { CatalogProduct } from '#lib/server/db/schema.js';

let {
	products,
	counts = $bindable({}),
}: {
	products: CatalogProduct[];
	/** `selectionKey(商品, 種類)` → 数量 */
	counts: Record<string, number>;
} = $props();

const clamp = (n: number) => Math.min(MAX_COUNT, Math.max(0, n));

function change(key: string, delta: number) {
	counts = { ...counts, [key]: clamp((counts[key] ?? 0) + delta) };
}

function set(key: string, value: string) {
	const n = Number(value);
	counts = { ...counts, [key]: Number.isFinite(n) ? clamp(Math.floor(n)) : 0 };
}
</script>

{#snippet stepper(
	key: string,
	label: string,
)}
	<div role="group">
		<button type="button" class="secondary" aria-label="減らす" onclick={() => change(key, -1)}>
			−
		</button>
		<input
			type="number"
			min="0"
			max={MAX_COUNT}
			inputmode="numeric"
			aria-label="{label}の数量"
			value={counts[key] ?? 0}
			oninput={(e) => set(key, e.currentTarget.value)}
		>
		<button type="button" aria-label="増やす" onclick={() => change(key, 1)}>＋</button>
	</div>
{/snippet}

<div class="lineup">
	{#each products as product (product.id)}
		<article>
			{#if product.image}
				<img src={`/img/${product.image}`} alt={product.title}>
			{/if}
			<h3>{product.title}</h3>
			<p>
				{product.price.toLocaleString()}円
				{#if product.desc}
					<br><small>{product.desc}</small>
				{/if}
			</p>
			{#if product.variants.length === 0}
				{@render stepper(selectionKey(product.id, null), product.title)}
			{:else}
				{#each product.variants as variant (variant.id)}
					<div class="variant">
						<span>{variant.name}</span>
						{@render stepper(
							selectionKey(product.id, variant.id),
							`${product.title} (${variant.name})`,
						)}
					</div>
				{/each}
			{/if}
		</article>
	{/each}
</div>

<style>
/* 商品の数に合わせて折り返す(Pico の .grid は全部を一行に並べてしまう) */
.lineup {
	display: grid;
	grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
	gap: var(--pico-grid-column-gap);
}
/* 写真の大きさが商品ごとに違っても揃える */
img {
	width: 100%;
	aspect-ratio: 3 / 2;
	object-fit: cover;
}
/* 種類ごとの数量。種類の名前を左に、増減のボタンを右に並べる */
.variant {
	display: grid;
	grid-template-columns: 4rem 1fr;
	align-items: baseline;
}
</style>

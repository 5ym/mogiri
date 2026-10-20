<script lang="ts">
import '@anyblades/blades/layered/content/table';
import '@anyblades/blades/layered/content/code';
import EntryLabel from '#lib/components/EntryLabel.svelte';
import { refreshAll } from '$app/navigation';
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
let loading = $state(false);

async function refresh() {
	loading = true;
	await refreshAll();
	loading = false;
}
</script>

<svelte:head>
	<title>入場受付の一覧 · mogiri</title>
</svelte:head>

<h1>入場受付の一覧</h1>
<button type="button" class="outline" disabled={loading} aria-busy={loading} onclick={refresh}>
	更新
</button>

{#if data.entries.length === 0}
	<p>登録はまだありません。</p>
{:else}
	<div class="overflow-auto">
		<table class="striped">
			<thead>
				<tr>
					<th>名前</th>
					<th>連絡先</th>
					<th>住所</th>
					<th>シークレット</th>
					<th>ステータス</th>
				</tr>
			</thead>
			<tbody>
				{#each data.entries as e (e.id)}
					<tr>
						<td><a href={`/entry/status?secret=${e.secret}`}>{e.name}</a></td>
						<td>{e.contact}</td>
						<td>{e.address}</td>
						<td><code>{e.secret}</code></td>
						<td><EntryLabel entry={e} /></td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

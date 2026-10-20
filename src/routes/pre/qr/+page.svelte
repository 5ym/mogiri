<script lang="ts">
import '@anyblades/blades/layered/content/code';
import { onMount } from 'svelte';
import OrderTable from '#lib/components/OrderTable.svelte';
import PayStatus from '#lib/components/PayStatus.svelte';
import type { PageData } from './$types';

let { data }: { data: PageData } = $props();
let dataUrl = $state('');

onMount(async () => {
	const QRCode = (await import('qrcode')).default;
	dataUrl = await QRCode.toDataURL(data.code, { width: 320, margin: 2 });
});
</script>

<svelte:head>
	<title>QRコード · mogiri</title>
</svelte:head>

<h1>QRコード</h1>
{#if data.method === 'cash' && !data.paid}
	<article>
		<p>当日、受け取り時に現金でお支払いください。</p>
		<p>お支払い金額 <strong>{data.order.total.toLocaleString()}円</strong></p>
	</article>
{/if}
<article>
	{#if dataUrl}
		<img src={dataUrl} alt="受け取り用QRコード" width="320" height="320">
	{:else}
		<p aria-busy="true">QRコードを作っています</p>
	{/if}
	<p>
		<small><code>{data.code}</code></small>
	</p>
</article>

<h2>注文内容</h2>
<article>
	<h3>{data.email}</h3>
	<p>
		<PayStatus method={data.method} paid={data.paid} />
		{#if data.received}
			<ins>受け取り済み</ins>
		{/if}
	</p>
	<OrderTable lines={data.order.lines} total={data.order.total} />
</article>

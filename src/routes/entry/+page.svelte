<script lang="ts">
import '@anyblades/blades/layered/content/code';
import { enhance, type SubmitFunction } from '$app/forms';
import { page } from '$app/state';
import type { ActionData } from './$types';

let { form }: { form: ActionData } = $props();
let loading = $state(false);
let qrDataUrl = $state('');

// 発行済みシークレットの QR(/entry/status?secret=... への URL)を描画する。
// スタッフが /real/accept で読み取ると入場受付の画面へ進む
$effect(() => {
	const secret = form?.secret;
	if (!secret) return;
	(async () => {
		const QRCode = (await import('qrcode')).default;
		const url = `${page.url.origin}/entry/status?secret=${secret}`;
		qrDataUrl = await QRCode.toDataURL(url, { width: 280, margin: 2 });
	})();
});

const submitHandler: SubmitFunction = () => {
	loading = true;
	return async ({ update }) => {
		await update({ reset: false });
		loading = false;
	};
};
</script>

<svelte:head>
	<title>入場受付 · mogiri</title>
</svelte:head>

{#if form?.secret}
	<article>
		<h1>あなたのシークレット</h1>
		<h2><code>{form.secret}</code></h2>
		{#if qrDataUrl}
			<img src={qrDataUrl} alt="入場用QRコード" width="280" height="280">
		{:else}
			<p aria-busy="true">QRコードを作っています</p>
		{/if}
		<p>
			<small>
				このQRコードを受付でご提示ください。シークレットは再発行に必要なので控えてください。
			</small>
		</p>
	</article>
{:else}
	<div class="grid">
		<article>
			<h1>入場登録</h1>
			{#if form?.error}
				<p><mark>{form.error}</mark></p>
			{/if}
			<form method="POST" action="?/register" use:enhance={submitHandler}>
				<label>
					名前
					<input name="name" type="text" required maxlength="255">
				</label>
				<label>
					連絡先
					<input name="contact" type="text" required maxlength="255">
				</label>
				<label>
					住所
					<input name="address" type="text" required maxlength="255">
				</label>
				<button type="submit" disabled={loading} aria-busy={loading}>登録</button>
			</form>
		</article>

		<article>
			<h2>QRチケットの再表示</h2>
			<form method="POST" action="?/reissue" use:enhance={submitHandler}>
				<label>
					シークレット
					<input
						name="secret"
						type="text"
						required
						inputmode="numeric"
						placeholder="9桁の数字"
						aria-invalid={form?.reissueError ? 'true' : undefined}
						aria-describedby={form?.reissueError ? 'reissue-error' : undefined}
					>
					{#if form?.reissueError}
						<small id="reissue-error">{form.reissueError}</small>
					{/if}
				</label>
				<button type="submit" class="secondary" disabled={loading} aria-busy={loading}>
					再表示
				</button>
			</form>
		</article>
	</div>
{/if}

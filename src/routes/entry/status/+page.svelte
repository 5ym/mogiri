<script lang="ts">
  import "@anyblades/blades/layered/content/table";
  import "@anyblades/blades/layered/content/code";
  import { enhance, type SubmitFunction } from "$app/forms";

  import EntryLabel from "#lib/components/EntryLabel.svelte";

  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();
  let loading = $state(false);

  const toggleHandler: SubmitFunction = () => {
    loading = true;
    return async ({ update }) => {
      // 失敗時のメッセージ (form) を出しつつ、ステータスを読み直す
      await update();
      loading = false;
    };
  };
</script>

<svelte:head>
  <title>入場ステータス · mogiri</title>
</svelte:head>

<article>
  <h1>入場ステータス</h1>
  {#if form?.error}
    <p><mark>{form.error}</mark></p>
  {/if}
  <table>
    <tbody>
      <tr>
        <th>名前</th>
        <td>{data.entry.name}</td>
      </tr>
      <tr>
        <th>連絡先</th>
        <td>{data.entry.contact}</td>
      </tr>
      <tr>
        <th>住所</th>
        <td>{data.entry.address}</td>
      </tr>
      <tr>
        <th>ステータス</th>
        <td><EntryLabel entry={data.entry} /></td>
      </tr>
      <tr>
        <th>シークレット</th>
        <td><code>{data.entry.secret}</code></td>
      </tr>
    </tbody>
  </table>

  <div class="grid">
    {#each [{ action: "pay", label: "支払切替", cls: "" }, { action: "entry", label: "入場切替", cls: "secondary" }, { action: "pe", label: "支払+入場", cls: "contrast" }] as b (b.action)}
      <!-- `?/toggle` だけだとクエリが置き換わって secret が落ち、送信後の画面 (JS 無しのとき) と
			     ログインからの戻り先が secret 無しになる。secret も付けたまま送る -->
      <form
        method="POST"
        action={`?secret=${encodeURIComponent(data.entry.secret)}&/toggle`}
        use:enhance={toggleHandler}
      >
        <input type="hidden" name="secret" value={data.entry.secret} />
        <input type="hidden" name="action" value={b.action} />
        <button type="submit" class={b.cls} disabled={loading}>{b.label}</button
        >
      </form>
    {/each}
  </div>
</article>

<a href="/real/accept" role="button" class="outline">続けて読み取る</a>
<a href="/entry/list" role="button" class="outline secondary">一覧に戻る</a>

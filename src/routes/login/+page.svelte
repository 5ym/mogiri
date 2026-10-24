<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData } from "./$types";

  let { form }: { form: ActionData } = $props();
  let loading = $state(false);
</script>

<svelte:head>
  <title>ログイン · mogiri</title>
</svelte:head>

<article>
  <h1>mogiri にログイン</h1>
  <form
    method="POST"
    use:enhance={() => {
      loading = true;
      return async ({ update }) => {
        await update();
        loading = false;
      };
    }}
  >
    <label>
      メールアドレス
      <input
        name="email"
        type="email"
        required
        maxlength="70"
        value={form?.email ?? ""}
        placeholder="you@example.com"
        aria-invalid={form?.error ? "true" : undefined}
      />
    </label>
    <label>
      パスワード
      <input
        name="password"
        type="password"
        required
        minlength="8"
        maxlength="20"
        placeholder="8文字以上"
        aria-invalid={form?.error ? "true" : undefined}
        aria-describedby={form?.error ? "login-error" : undefined}
      />
      {#if form?.error}
        <small id="login-error">{form.error}</small>
      {/if}
    </label>
    <button type="submit" disabled={loading} aria-busy={loading}>Login</button>
  </form>
</article>

<script lang="ts">
  import "../app.css";
  import { enhance } from "$app/forms";
  import { page } from "$app/state";

  import Toasts from "#lib/components/Toasts.svelte";

  let { children } = $props();
  const user = $derived(page.data.user);
</script>

<header class="container">
  <nav>
    <ul>
      <li>
        <a href="/"><strong>mogiri</strong></a>
      </li>
    </ul>
    <ul>
      {#if user}
        {#if user.isStaff}
          <li><a href="/entry/list">入場一覧</a></li>
          <li><a href="/real/admin">管理</a></li>
        {/if}
        <li>
          <form method="POST" action="/logout" use:enhance>
            <button type="submit" class="outline secondary">ログアウト</button>
          </form>
        </li>
      {:else}
        <li><a href="/login" role="button">ログイン</a></li>
      {/if}
    </ul>
  </nav>
</header>

<main class="container">
  {@render children()}
</main>

<footer class="container">
  <small>
    {#if user}
      {user.email}
      でログイン中 ·
    {/if}
    mogiri · Bun + SvelteKit + SQLite + Blades
  </small>
</footer>

<Toasts />

<script lang="ts">
  import { toasts } from "#lib/stores/toast.svelte.js";
</script>

<div class="toasts">
  {#each toasts.items as t (t.id)}
    <article role={t.kind === "error" ? "alert" : "status"}>
      <strong>{t.title}</strong>
      {#if t.message}
        <!-- Toast messages are developer-authored constant strings (never user
				     input), so rendering the small amount of markup they contain (links,
				     line breaks) is safe here. -->
        <!-- eslint-disable-next-line svelte/no-at-html-tags -->
        <p>{@html t.message}</p>
      {/if}
      <button
        type="button"
        class="outline secondary"
        onclick={() => toasts.dismiss(t.id)}
      >
        閉じる
      </button>
    </article>
  {/each}
</div>

<style>
  /* 画面の右上に積む。中身が無いときは下の画面を触れるようにする */
  .toasts {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 50;
    width: min(24rem, calc(100% - 2rem));
    pointer-events: none;
  }
  article {
    pointer-events: auto;
  }
</style>

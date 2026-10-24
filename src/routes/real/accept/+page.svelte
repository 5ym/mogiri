<script lang="ts">
  import type { Html5Qrcode } from "html5-qrcode";
  import { onDestroy, onMount } from "svelte";
  import { entryStatusPath, isValidCode } from "#lib/validation.js";
  import { goto } from "$app/navigation";

  let scanner: Html5Qrcode | null = null;
  let error = $state("");
  let handled = false;

  onMount(async () => {
    const { Html5Qrcode } = await import("html5-qrcode");
    scanner = new Html5Qrcode("qr-reader");
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScan,
        () => {},
      );
    } catch (e) {
      error =
        e instanceof Error
          ? `カメラを起動できませんでした: ${e.message}`
          : "カメラを起動できませんでした";
    }
  });

  async function onScan(text: string) {
    if (handled) return;
    // 入場 QR (`/entry/status?secret=…` の URL) なら入場受付の画面へ
    const entryPath = entryStatusPath(text);
    if (entryPath) {
      handled = true;
      await stop();
      goto(entryPath);
    } else if (isValidCode(text)) {
      handled = true;
      await stop();
      goto(`/real/confirm/${text}`);
    } else {
      error =
        "不正なQRコードかQRコードが正しく読み取れませんでした。もう一度読み込み直してください。";
    }
  }

  async function stop() {
    if (scanner?.isScanning) {
      try {
        await scanner.stop();
      } catch {
        /* ignore */
      }
    }
  }

  onDestroy(stop);
</script>

<svelte:head>
  <title>QR読み取り · mogiri</title>
</svelte:head>

<h1>受け取り用・入場用のQRコードを読み込ませてください</h1>

<div id="qr-reader"></div>

{#if error}
  <p><mark>{error}</mark></p>
{/if}

<a href="/real" role="button" class="outline">戻る</a>

<style>
  /* html5-qrcode が中に video を差し込む枠。広い画面でもカメラ映像を大きくしすぎない */
  #qr-reader {
    max-width: 28rem;
    margin-bottom: var(--pico-spacing);
  }
</style>

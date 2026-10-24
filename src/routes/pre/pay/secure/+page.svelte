<script lang="ts">
  import { page } from "$app/state";
  import { onMount } from "svelte";

  // This page is loaded inside the 3DS iframe. It finalises the payment and
  // notifies the parent window that authentication completed.
  onMount(async () => {
    const notify = () =>
      window.top?.postMessage("3DS-authentication-complete", "*");
    const paymentIntent = page.url.searchParams.get("payment_intent");
    if (window === window.parent || !paymentIntent) {
      notify();
      return;
    }
    try {
      await fetch("/api/pay/secure", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: paymentIntent }),
      });
    } finally {
      notify();
    }
  });
</script>

<p aria-busy="true">処理中...</p>

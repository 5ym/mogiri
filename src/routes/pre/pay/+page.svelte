<script lang="ts">
  import "@anyblades/blades/layered/components/modal";
  import { enhance } from "$app/forms";
  import { goto } from "$app/navigation";
  import type { Stripe, StripeCardElement } from "@stripe/stripe-js";
  import { onMount } from "svelte";

  import OrderTable from "#lib/components/OrderTable.svelte";
  import { PAY_METHOD_LABELS } from "#lib/order.js";
  import { toasts } from "#lib/stores/toast.svelte.js";

  import type { ActionData, PageData } from "./$types";

  let { data, form }: { data: PageData; form: ActionData } = $props();

  // カード決済が使えるときはカードを先に選んでおく。使えないときは当日現金払いだけ
  const cardAvailable = $derived(
    data.stripeConfigured && Boolean(data.publishableKey),
  );
  let method = $state<"stripe" | "cash">();
  const selected = $derived(method ?? (cardAvailable ? "stripe" : "cash"));

  let stripe: Stripe | null = null;
  let card: StripeCardElement | null = null;
  let cardError = $state("");
  let loading = $state(false);
  let show3ds = $state(false);
  let iframeUrl = $state("");
  let intentSecret = "";

  $effect(() => {
    if (form?.error) toasts.error("エラー", form.error);
  });

  async function onSucceeded() {
    toasts.success(
      "決済完了",
      "カード決済が完了しました。3秒後にQRコード画面に移動します。",
    );
    setTimeout(() => goto("/pre/qr"), 3000);
  }

  onMount(() => {
    if (!data.stripeConfigured || !data.publishableKey) return;

    (async () => {
      const { loadStripe } = await import("@stripe/stripe-js");
      stripe = await loadStripe(data.publishableKey);
      if (!stripe) return;
      card = stripe.elements().create("card");
      card.mount("#card-element");
      card.on("change", (event) => {
        cardError = event.error?.message ?? "";
      });
    })();

    const onMessage = (ev: MessageEvent) => {
      if (ev.data !== "3DS-authentication-complete" || !stripe) return;
      show3ds = false;
      stripe.retrievePaymentIntent(intentSecret).then((result) => {
        if (result.paymentIntent?.status === "succeeded") {
          onSucceeded();
        } else {
          toasts.error(
            "エラー",
            "カード決済時にエラーが発生しました。別のカードをお試しいただくか、カード会社にお問い合わせください。",
          );
        }
      });
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  });

  async function submit() {
    if (!stripe || !card) return;
    loading = true;
    try {
      const method = await stripe.createPaymentMethod({ type: "card", card });
      if (method.error) {
        cardError = method.error.message ?? "";
        loading = false;
        return;
      }
      const res = await fetch("/api/pay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token: method.paymentMethod.id }),
      });
      if (res.ok) {
        loading = false;
        await onSucceeded();
        return;
      }
      const body = await res.json();
      if (res.status === 401) {
        goto("/login?redirect=/pre/pay");
      } else if (Array.isArray(body) && body[0] === "req") {
        const r = await stripe.retrievePaymentIntent(body[1]);
        intentSecret = r.paymentIntent?.client_secret ?? body[1];
        const nextAction = r.paymentIntent?.next_action;
        iframeUrl = nextAction?.redirect_to_url?.url ?? "";
        show3ds = true;
      } else {
        const msg = Array.isArray(body)
          ? body[0]
          : (body?.message ?? "不明なエラー");
        toasts.error(
          "エラー",
          `カード決済時にエラーが発生しました。<br>${msg}`,
        );
      }
    } catch {
      toasts.error("エラー", "カード決済時にエラーが発生しました。");
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>お支払い · mogiri</title>
</svelte:head>

<h1>注文内容をご確認ください</h1>
<article>
  <h2>{data.email}</h2>
  <OrderTable lines={data.order.lines} total={data.order.total} />
</article>

<article>
  <h2>お支払い方法</h2>
  <fieldset>
    {#if cardAvailable}
      <label>
        <input
          type="radio"
          name="method"
          value="stripe"
          checked={selected === "stripe"}
          onchange={() => (method = "stripe")}
        />
        {PAY_METHOD_LABELS.stripe}
      </label>
    {/if}
    <label>
      <input
        type="radio"
        name="method"
        value="cash"
        checked={selected === "cash"}
        onchange={() => (method = "cash")}
      />
      {PAY_METHOD_LABELS.cash}
    </label>
  </fieldset>

  <!-- Stripe はページを開いたときにカード欄を差し込むので、選んでいないときも消さずに隠す -->
  <div hidden={selected !== "stripe"}>
    <div id="card-element"></div>
    {#if cardError}
      <p role="alert"><mark>{cardError}</mark></p>
    {/if}
    <button
      type="button"
      disabled={loading || !cardAvailable}
      aria-busy={loading}
      onclick={submit}
    >
      支払
    </button>
  </div>

  {#if selected === "cash"}
    <form
      method="POST"
      action="?/cash"
      use:enhance={() => {
        loading = true;
        return async ({ update }) => {
          await update();
          loading = false;
        };
      }}
    >
      <p>
        受け取りのときに、現金で
        <strong>{data.order.total.toLocaleString()}円</strong>
        をお支払いください。注文を確定すると受け取り用のQRコードが表示されます。
      </p>
      <button type="submit" disabled={loading} aria-busy={loading}
        >当日現金払いで注文する</button
      >
    </form>
  {/if}
</article>

{#if show3ds}
  <dialog open>
    <article>
      <iframe src={iframeUrl} title="3D Secure"></iframe>
    </article>
  </dialog>
{/if}

<style>
  /* Stripe が iframe を差し込む枠。入力欄に見えるよう Pico の入力欄の線を借りる */
  #card-element {
    margin-bottom: var(--pico-spacing);
    border: var(--pico-border-width) solid var(--pico-form-element-border-color);
    border-radius: var(--pico-border-radius);
    padding: var(--pico-form-element-spacing-vertical)
      var(--pico-form-element-spacing-horizontal);
  }
  /* 3D セキュアの画面。カード会社のページをそのまま重ねて出す */
  iframe {
    display: block;
    width: 100%;
    height: 80vh;
    border: 0;
  }
</style>

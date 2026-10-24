<script lang="ts">
  const options = [
    {
      href: "/pre",
      title: "事前購入",
      subtitle: "事前購入されたい方はこちら",
      cls: "",
    },
    {
      href: "/real",
      title: "対面販売",
      subtitle: "対面販売でのセルフレジを使う場合はこちら",
      cls: "secondary",
    },
    {
      href: "/entry",
      title: "入場受付",
      subtitle: "入場登録と入場用QRコードの表示はこちら",
      cls: "contrast",
    },
  ];
</script>

<svelte:head>
  <title>mogiri</title>
</svelte:head>

<div class="grid">
  {#each options as opt (opt.href)}
    <a href={opt.href} role="button" class={opt.cls}>
      <strong>{opt.title}</strong><br />
      <small>{opt.subtitle}</small>
    </a>
  {/each}
</div>

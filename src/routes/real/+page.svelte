<script lang="ts">
  const options = [
    {
      href: "/real/accept",
      title: "受け取り",
      subtitle: "事前購入された方はこちら",
      img: "/img/real0.svg",
    },
    {
      href: "/real/buy",
      title: "当日購入",
      subtitle: "当日お買い求めの方はこちら",
      img: "/img/real1.svg",
    },
  ];
</script>

<svelte:head>
  <title>対面販売 · mogiri</title>
</svelte:head>

<div class="grid">
  {#each options as opt (opt.href)}
    <a href={opt.href}>
      <article>
        <img src={opt.img} alt={opt.title} />
        <h2>{opt.title}</h2>
        <p>{opt.subtitle}</p>
      </article>
    </a>
  {/each}
</div>

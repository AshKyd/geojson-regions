<script lang="ts">
	interface Props {
		title: string;
		description: string;
		/** Canonical address of the page. */
		url: string;
		/** Absolute address of a 1200×630 preview image. */
		image: string;
	}

	let { title, description, url, image }: Props = $props();
</script>

<svelte:head>
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:image" content={image} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

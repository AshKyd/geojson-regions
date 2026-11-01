<script lang="ts">
	import type { LayoutProps } from './$types';
	import '../app.css';

	let { children }: LayoutProps = $props();
</script>

<svelte:head>
	<link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg" />
	<link rel="apple-touch-icon" sizes="180x180" href="/favicon.png" />
	<link rel="manifest" href="/web-app-manifest.json" />
	<link rel="preload" as="fetch" href="/countries/110m/all.geojson" crossorigin="anonymous" />
</svelte:head>

{@render children()}

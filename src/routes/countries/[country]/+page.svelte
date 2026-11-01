<script lang="ts">
	import OgMeta from '#lib/components/OgMeta/OgMeta.svelte';
	import VariantTable from '#lib/components/VariantTable/VariantTable.svelte';
	import { SITE_URL } from '#lib/constants.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { country, variants } = $derived(data);
</script>

<svelte:head>
	<title>{country.name} – GeoJSON Maps</title>
	<meta
		name="description"
		content="The {country.name} outline as GeoJSON, from {variants.length} {variants.length === 1
			? 'point of view'
			: 'points of view'}."
	/>
	<link rel="canonical" href="{SITE_URL}/countries/{country.code}" />
</svelte:head>

<OgMeta
	title="{country.name} – GeoJSON Maps"
	description="Download the {country.name} outline as GeoJSON or SVG."
	url="{SITE_URL}/countries/{country.code}"
	image="{SITE_URL}/countries/{country.code}/og.png"
/>

<!-- With only Natural Earth's shape there is nothing to switch between. -->
{#if variants.length > 1}
	<h3>Points of view</h3>
	<p class="p">
		This is Natural Earth's own shape, which draws de facto borders: borders according to who
		controls the territory. Choose another from the list:
	</p>
	<VariantTable
		country={country.code}
		{variants}
		defaultSlug={data.shownPov.slug}
		current={data.shownPov.slug}
	/>
{/if}

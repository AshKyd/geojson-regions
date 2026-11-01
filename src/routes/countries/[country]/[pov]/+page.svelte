<script lang="ts">
	import OgMeta from '#lib/components/OgMeta/OgMeta.svelte';
	import VariantTable from '#lib/components/VariantTable/VariantTable.svelte';
	import { NATURAL_EARTH_SLUG, SITE_URL } from '#lib/constants.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const { pov, country } = $derived(data);
	// Identical shapes 404, so every page that exists is its own canonical.
	/** Every country sharing this view, listed in full here since the list entry is shortened. */
	const fullNames = $derived(
		new Intl.ListFormat('en-AU', { type: 'conjunction' }).format(pov.sharedWith ?? [pov.name])
	);
	const canonicalUrl = $derived(`${SITE_URL}/countries/${country.code}/${pov.slug}`);
</script>

<svelte:head>
	<title>{country.name} ({pov.name}) – GeoJSON Maps</title>
	<meta
		name="description"
		content="Download the {country.name} outline as GeoJSON, from the {pov.name} point of view."
	/>
	<link rel="canonical" href={canonicalUrl} />
</svelte:head>

<!-- Only country pages get their own image, so a point of view shares its country's. -->
<OgMeta
	title="{country.name} ({pov.name}) – GeoJSON Maps"
	description="Download the {country.name} outline as GeoJSON, from the {pov.name} point of view."
	url={canonicalUrl}
	image="{SITE_URL}/countries/{country.code}/og.png"
/>

{#if data.povs.length > 1}
	<h3>Points of view</h3>
	<p class="p">
		{#if pov.slug === NATURAL_EARTH_SLUG}
			This is Natural Earth's shape, which draws de facto borders: borders according to who controls
			the territory.
		{:else}
			This is {country.name} according to {fullNames}.
		{/if}
		Choose another from the list:
	</p>
	<VariantTable
		country={country.code}
		variants={data.povs.map((published) => ({ pov: published }))}
		defaultSlug={data.povs[0]?.slug ?? ''}
		current={pov.slug}
	/>
{/if}

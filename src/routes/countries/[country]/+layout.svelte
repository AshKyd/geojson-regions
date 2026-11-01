<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { Button } from 'svelte-akui';
	import CountryShape from '#lib/components/CountryShape/CountryShape.svelte';
	import WikipediaExcerpt from '#lib/components/WikipediaExcerpt/WikipediaExcerpt.svelte';
	import { NATURAL_EARTH_SLUG } from '#lib/constants.ts';
	import type { MapPaths } from '#lib/utils/mapTypes.ts';
	import type { LayoutProps } from './$types';

	/** What both the country page and the point-of-view page load; the layout reads it from `page.data`. */
	interface ShapePageData {
		country: { code: string; name: string };
		outlinesPath: string;
		/** The map, projected at build time. */
		map: MapPaths;
		excerpt?: { title: string; revision: number; excerpt: string };
		/** Only on a point-of-view page, where the breadcrumb ends with it. */
		pov?: { slug: string; name: string };
		/** Only on the country page: its default point of view. */
		shownPov?: { slug: string; name: string };
	}

	let { children }: LayoutProps = $props();

	const { country, outlinesPath, map, excerpt, pov, shownPov } = $derived(
		page.data as ShapePageData
	);

	/** The point of view on screen: `pov` on its own page, `shownPov` (the default) on the country page. */
	const shown = $derived(pov ?? shownPov ?? { slug: NATURAL_EARTH_SLUG, name: '' });

	// A point of view's shape differs from Natural Earth's, so its name goes in the filename to keep
	// the downloads apart: CHN-arg.geojson. Natural Earth's shape has no suffix.
	const fileBase = $derived(
		shown.slug === NATURAL_EARTH_SLUG ? country.code : `${country.code}-${shown.slug}`
	);

	const isDeFacto = $derived(shown.slug === NATURAL_EARTH_SLUG);
	/** Names the graphic by what this page is for: one country, in one point of view. */
	const mapTitle = $derived(
		isDeFacto
			? `Map of ${country.name} (de facto borders)`
			: `Map of ${country.name} according to ${shown.name}`
	);
	const mapDescription = $derived(
		isDeFacto
			? `${country.name} highlighted among its neighbouring countries, with borders drawn as Natural Earth shows them: according to who controls the territory. Hover a neighbour to see its name.`
			: `${country.name} highlighted among its neighbouring countries, with its borders drawn according to the ${shown.name} point of view. Hover a neighbour to see its name.`
	);

	/** The prerendered outline for the point of view on screen; the default one lives under the country. */
	const svgHref = $derived(
		pov
			? resolve('/countries/[country]/[pov]/outline.svg', { country: country.code, pov: pov.slug })
			: resolve('/countries/[country]/outline.svg', { country: country.code })
	);
</script>

<!--
	The map lives here rather than in each page, so moving between a country's points of view keeps
	the same component and the old map can cross-fade into the new one. Each map is projected at build
	time (the site is static), so it's already in the page when it loads.
-->
<div class="app mb">
	<div class="app-header">
		<h2>
			<a href={resolve('/countries')}>Countries</a> ›
			{#if pov}
				<a href={resolve('/countries/[country]', { country: country.code })}>{country.name}</a> ›
				{pov.name}
			{:else}
				{country.name}
			{/if}
		</h2>
	</div>
	<div class="country">
		<!--
			On wide screens: the map over the points of view on the left, and one tall side column
			(description, then download) on the right. Stacked on narrow screens.
		-->
		<div class="map">
			<CountryShape
				{map}
				target={country}
				shapeKey={shown.slug}
				title={mapTitle}
				description={mapDescription}
			/>
		</div>
		<!-- Empty (and hidden) when the country has no other points of view. -->
		<div class="cell details">{@render children()}</div>
		<div class="cell side">
			{#if excerpt}
				<WikipediaExcerpt excerpt={excerpt.excerpt} />
			{/if}
			<section class="download">
				<h3>Download {country.name} borders</h3>
				<p class="p">
					Download {shown.slug === NATURAL_EARTH_SLUG
						? `${country.name} de-facto borders`
						: `${country.name} according to ${shown.name}`}
					in geojson or svg format to use in your own projects
				</p>
				<div class="download-buttons">
					<Button
						variant="accent"
						size="large"
						icon="filetype-json"
						iconPosition="left"
						href="{outlinesPath}/{country.code}.geojson"
						download="{fileBase}.geojson"
					>
						Download GeoJSON
					</Button>
					<Button
						size="large"
						icon="filetype-svg"
						iconPosition="left"
						href={svgHref}
						download="{fileBase}.svg"
					>
						Download SVG
					</Button>
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	/*
		Same look as the home page: the map sits on the page gradient, the other cells on the panel colour.
		The backdrop belongs to the cell, which stretches to the row's height, so it always fills the
		space; the shape inside just centres its (fixed aspect ratio) SVG.
	*/
	.map {
		display: flex;
		flex-direction: column;
		justify-content: center;
		-webkit-backdrop-filter: var(--map-background);
		backdrop-filter: var(--map-background);
		color: white;
	}
	.cell {
		padding: 1rem;
		background: var(--app-bg);
		color: var(--app-text);
	}
	.details:empty {
		display: none;
	}
	.app-header h2 a {
		color: white;
	}
	.download h3 {
		margin-bottom: 0.75rem;
	}
	.download .p {
		margin-bottom: 1rem;
	}
	/* Stacked, each button spanning the sidebar's width up to a cap. */
	.download-buttons {
		max-width: 450px;
		margin-inline: auto;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	.download-buttons > :global(*) {
		width: 100%;
	}

	.download {
		margin-top: 1rem;
	}

	/* Wide screens: map over points of view on the left; the side column spans both rows. */
	@media (min-width: 50rem) {
		.country {
			display: grid;
			grid-template-columns: 2fr 1fr;
			/* Spare height goes to the points of view, not the map. */
			grid-template-rows: auto 1fr;
		}
		/* No points of view: the map takes the whole column instead. */
		.country:has(.details:empty) {
			grid-template-rows: 1fr;
		}
		.map {
			grid-column: 1;
			grid-row: 1;
		}
		.details {
			grid-column: 1;
			grid-row: 2;
		}
		.side {
			grid-column: 2;
			grid-row: 1 / -1;
		}
	}
</style>

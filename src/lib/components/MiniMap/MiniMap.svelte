<script lang="ts">
	import { geoEqualEarth, geoPath } from 'd3-geo';
	import { fetchJson, MAP_OUTLINES_URL, featureFilename } from '#lib/utils/countries.ts';

	interface Props {
		/** [longitude, latitude] of the country being shown, marked on the world map. */
		centre: [number, number];
		/** Filename code of the country (e.g. "AUS"); highlighted if the low-res outlines include it. */
		code: string;
	}

	let { centre, code }: Props = $props();

	const width = 200;
	const height = 98;

	let features = $state<GeoJSON.Feature[]>([]);

	// The same low-resolution world outlines the map builder previews with; the browser has them cached.
	$effect(() => {
		fetchJson<GeoJSON.FeatureCollection>(MAP_OUTLINES_URL)
			.then((collection) => (features = collection.features))
			.catch(() => (features = []));
	});

	// Turned to the country's longitude, so the marker sits mid-map and the cut falls on the far side.
	const projection = $derived(
		geoEqualEarth().rotate([-centre[0], 0]).fitSize([width, height], { type: 'Sphere' })
	);
	const pathFor = $derived(geoPath(projection));
	const marker = $derived(projection(centre));
	const highlighted = $derived(`${code}.geojson`);
</script>

<!-- The blur softens the main map's countries beneath, so they can't muddy the minimap. -->
<!-- Blur and rounded corners live on their own div; the tint is a child so it's clipped to the corners too. -->
<div class="backdrop">
	<div class="tint">
		<svg viewBox="0 0 {width} {height}" aria-hidden="true">
			{#each features as feature, position (position)}
				<path
					class:highlight={featureFilename(feature.properties ?? {}) === highlighted}
					d={pathFor(feature) ?? ''}
				/>
			{/each}
			{#if marker}
				<!-- Small countries aren't in the low-res outlines, so a marker always shows where this one is. -->
				<circle class="marker" cx={marker[0]} cy={marker[1]} r="4" />
			{/if}
		</svg>
	</div>
</div>

<style>
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	.backdrop {
		border-radius: 100px;
		overflow: hidden;
		-webkit-backdrop-filter: blur(0.75rem);
		backdrop-filter: blur(0.75rem);
	}
	/* Dense enough to stay legible even where a browser skips the blur (Firefox inside another backdrop-filter). */
	.tint {
		padding: 0.25rem;
		background: rgb(25 8 49 / 0.75);
	}
	/* It sits over the main map, not the sidebar panel, so land is light in both colour schemes. */
	path {
		fill: rgb(255 255 255 / 0.55);
		stroke: none;
	}
	.highlight {
		fill: var(--footer-link);
	}
	.marker {
		fill: none;
		stroke: var(--footer-link);
		stroke-width: 2;
	}
</style>

<script lang="ts">
	import { UIRoot } from 'svelte-akui';
	import { SvelteSet } from 'svelte/reactivity';
	import BuildButton from '#lib/components/BuildButton/BuildButton.svelte';
	import BuildOptions from '#lib/components/BuildOptions/BuildOptions.svelte';
	import BuildProgress from '#lib/components/BuildProgress/BuildProgress.svelte';
	import CountryMap from '#lib/components/CountryMap/CountryMap.svelte';
	import PageFooter from '#lib/components/PageFooter/PageFooter.svelte';
	import {
		buildFeatureCollection,
		downloadUrls,
		fetchJson,
		MAP_OUTLINES_URL,
		outlinesPath,
		regionFilenames,
		type CountryIndex,
		type Resolution
	} from '#lib/utils/countries.ts';
	import { saveJson } from '#lib/utils/saveJson.ts';

	/** Point-of-view codes and names; empty until `povs.json` loads (or if it hasn't been generated yet). */
	let povs = $state<Record<string, string>>({});
	let resolution = $state<Resolution>('110m');
	let pov = $state('');
	let mapFeatures = $state<GeoJSON.Feature[]>([]);
	let regionIndex = $state<CountryIndex>();
	let downloadProgress = $state<number>();
	const selected = new SvelteSet<string>();

	$effect(() => {
		fetchJson<Record<string, string>>('/countries/povs.json')
			.then((list) => (povs = list))
			.catch(() => {});
	});

	// The preview map is fixed at low resolution; the point of view only affects the download.
	$effect(() => {
		fetchJson<GeoJSON.FeatureCollection>(MAP_OUTLINES_URL).then(
			({ features }) => (mapFeatures = features)
		);
	});

	// Regions come from the point of view's own index, because its countries differ slightly.
	$effect(() => {
		const url = `${outlinesPath({ resolution: '10m', pov })}/index.json`;
		let stale = false;
		fetchJson<CountryIndex>(url).then((index) => {
			if (!stale) regionIndex = index;
		});
		return () => (stale = true);
	});

	const isRegionSelected = (regionName: string) => {
		if (!regionIndex) return false;
		const filenames = regionFilenames(regionIndex, regionName);
		return filenames.length > 0 && filenames.every((name) => selected.has(name));
	};

	function onregionchange(regionName: string, checked: boolean) {
		if (!regionIndex) return;
		regionFilenames(regionIndex, regionName).forEach((filename) =>
			checked ? selected.add(filename) : selected.delete(filename)
		);
	}

	async function build() {
		const basePath = outlinesPath({ resolution, pov });
		downloadProgress = 0;
		const index = await fetchJson<CountryIndex>(`${basePath}/index.json`);
		// Nothing selected means the whole world, rather than an empty map.
		const wanted = selected.size
			? selected
			: Object.values(index.all).map(({ filename }) => filename);
		const collection = await buildFeatureCollection({
			urls: downloadUrls({ selected: wanted, index, basePath }),
			onprogress: (fraction) => (downloadProgress = fraction)
		});
		saveJson(JSON.stringify(collection), 'custom.geo.json');
		downloadProgress = undefined;
	}
</script>

<svelte:head>
	<title>GeoJSON Maps of the globe</title>
	<meta
		name="description"
		content="Customise and download free vector maps in GeoJSON format for your web apps and visualisations."
	/>
	<meta property="og:title" content="GeoJSON Maps" />
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://geojson-maps.kyd.au/" />
	<meta property="og:image" content="https://geojson-maps.kyd.au/og-image.png" />
	<meta name="google-site-verification" content="ga7oKI1DWjrLAT6A_ET831BJDiMxxNpACzUerFAxPrU" />
</svelte:head>

<UIRoot>
	<main>
	<div class="page-header mb">
		<h1 class="page-header__heading">Download GeoJSON countries</h1>
		<p class="page-header__intro">Vector maps</p>
	</div>

	<div class="app mb">
		<div class="app-header">
			<h2>Build your map</h2>
		</div>
		<div class="responsive-app__container">
			<div class="responsive-app">
				<div class="controls">
					<div class="col-md-4 build-col">
						<div class="build-widget">
							<p class="p">Tap the map to select your countries or choose from the presets.</p>
							<BuildButton onbuild={build} busy={downloadProgress !== undefined} />
						</div>
					</div>

					<BuildOptions bind:resolution bind:pov {povs} {isRegionSelected} {onregionchange} />
				</div>

				<div class="map-column">
					<CountryMap features={mapFeatures} {selected} />
				</div>
			</div>

			{#if downloadProgress !== undefined}
				<BuildProgress value={downloadProgress} />
			{/if}
		</div>
	</div>
	</main>

	<PageFooter />
</UIRoot>

<script lang="ts">
	import { ClearableInput } from 'svelte-akui';
	import CountryIndexList from '#lib/components/CountryIndexList/CountryIndexList.svelte';
	import { SITE_URL } from '#lib/constants.ts';
	import { filterCountries } from '#lib/utils/filterCountries.ts';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	let query = $state('');
	const matches = $derived(filterCountries(data.countries, query));
</script>

<svelte:head>
	<title>Countries – GeoJSON Maps</title>
	<meta
		name="description"
		content="Every country and territory with a downloadable GeoJSON outline, and the points of view that draw it differently."
	/>
	<link rel="canonical" href="{SITE_URL}/countries" />
</svelte:head>

<div class="app mb">
	<div class="app-header"><h2>Countries</h2></div>
	<div class="panel layout">
		<div class="intro">
			<p class="p">
				{data.countries.length} countries and territories. Open one to see its shape from each point of
				view.
			</p>
			<ClearableInput
				type="search"
				bind:value={query}
				placeholder="Filter countries"
				aria-label="Filter countries"
			/>
		</div>
		<div class="content">
			{#if matches.length}
				<CountryIndexList countries={matches} />
			{:else}
				<p class="p">No countries match “{query}”.</p>
			{/if}
		</div>
	</div>
</div>

<style>
	/* White links need a dark ground in both colour schemes; the panel's own is white in light mode. */
	.panel {
		background: rgb(0 0 0 / 0.5);
		color: white;
	}
	.panel :global(a) {
		color: white;
	}
	.intro p {
		margin-bottom: 1rem;
	}
	/* A comfortable line length on large screens. */
	.content {
		max-width: 60rem;
	}
	/* On wide screens the intro and filter sit in a sidebar beside the list, and stay in view while scrolling. */
	@media (min-width: 50rem) {
		.layout {
			display: grid;
			grid-template-columns: 16rem 1fr;
			gap: 2rem;
			align-items: start;
		}
		/* The top padding matches the space above the list's first letter, so the two start level. */
		.intro {
			position: sticky;
			top: 1rem;
			padding-top: 2rem;
		}
	}
</style>

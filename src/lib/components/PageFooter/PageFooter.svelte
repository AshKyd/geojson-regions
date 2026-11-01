<script lang="ts">
	import { resolve } from '$app/paths';
	import WikipediaAttribution from '#lib/components/WikipediaAttribution/WikipediaAttribution.svelte';

	interface Props {
		/** The Wikipedia article quoted on the page, if any; credited here. */
		wikipedia?: { title: string; revision: number };
	}

	let { wikipedia }: Props = $props();
</script>

<footer class="page-footer">
	<div class="row">
		<div class="col-md-6">
			<p class="p p-narrow">
				Customise and download free vector maps in GeoJSON format for your web apps and
				visualisations.
			</p>
			<p class="p p-narrow">
				These maps are sourced from
				<a href="http://naturalearthdata.com">Natural Earth</a> and are in the public domain, so you are
				free to use them in any way without attribution. Natural Earth draws de facto boundaries by default:
				borders according to who controls the territory. Choose a point of view to see borders as each
				country draws them itself.
			</p>
			{#if wikipedia}
				<WikipediaAttribution {...wikipedia} />
			{/if}
			<p class="p">
				<a href={resolve('/countries')}>Browse every country and point of view</a>.
			</p>
			<p class="p">
				Site © 2026
				<a href="https://ashk.au" referrerpolicy="origin">Ash Kyd</a>. Contribute on
				<a href="https://github.com/AshKyd/geojson-regions">GitHub</a>. Or for something different,
				take a
				<a href="https://briscycle.com/" referrerpolicy="origin">bike trip to Brisbane</a>.
			</p>
		</div>
		<div class="col-md-6"></div>
	</div>
</footer>

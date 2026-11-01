<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import BrowseShell from '#lib/components/BrowseShell/BrowseShell.svelte';
	import { NATURAL_EARTH_SLUG } from '#lib/constants.ts';
	import type { LayoutProps } from './$types';

	/** What a country or point-of-view page loads; other browse pages have none of it. */
	interface CountryPageData {
		country?: { name: string };
		/** The point of view being shown: `pov` on its own page, `shownPov` on the country page. */
		pov?: { slug: string; name: string };
		shownPov?: { slug: string; name: string };
		excerpt?: { title: string; revision: number };
	}

	let { children }: LayoutProps = $props();

	const { country, pov, shownPov, excerpt } = $derived(page.data as CountryPageData);
	const shown = $derived(pov ?? shownPov);
	const subheading = $derived(
		shown && (shown.slug === NATURAL_EARTH_SLUG ? 'de facto borders' : `according to ${shown.name}`)
	);
</script>

<!-- A country or point-of-view page goes up to the countries list; the list goes up to the main index. -->
<BrowseShell
	heading={country?.name}
	{subheading}
	wikipedia={excerpt && { title: excerpt.title, revision: excerpt.revision }}
	backHref={country ? resolve('/countries') : resolve('/')}
	backLabel={country ? 'Back to countries' : 'Back to the map builder'}
>
	{@render children()}
</BrowseShell>

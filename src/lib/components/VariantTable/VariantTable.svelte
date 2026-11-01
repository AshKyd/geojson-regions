<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		/** Filename code of the country, used in each link. */
		country: string;
		variants: { pov: { slug: string; name: string } }[];
		/** Slug of the country's default point of view, which is the country page itself. */
		defaultSlug: string;
		/** Slug of the point of view being shown; listed as plain text so the list never reshuffles. */
		current: string;
	}

	let { country, variants, defaultSlug, current }: Props = $props();
</script>

<ul class="inline-list">
	{#each variants as { pov } (pov.slug)}
		<li>
			{#if pov.slug === current}
				<strong aria-current="page">{pov.name}</strong>
			{:else if pov.slug === defaultSlug}
				<!-- The default shape is the country page itself. -->
				<a href={resolve('/countries/[country]', { country })}>{pov.name}</a>
			{:else}
				<a href={resolve('/countries/[country]/[pov]', { country, pov: pov.slug })}>{pov.name}</a>
			{/if}
		</li>
	{/each}
</ul>

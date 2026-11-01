<script lang="ts">
	import { Button, UIRoot } from 'svelte-akui';
	import PageFooter from '#lib/components/PageFooter/PageFooter.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		children: Snippet;
		/** Replaces the default "GeoJSON countries" title, e.g. the country being shown. */
		heading?: string;
		/** Line under a custom heading, e.g. whose point of view the borders are from. */
		subheading?: string;
		/** Where the back button goes: the next level up from this page. */
		backHref: string;
		/** Accessible name for the back button, e.g. "Back to countries". */
		backLabel: string;
		/** The Wikipedia article quoted on the page, credited in the footer. */
		wikipedia?: { title: string; revision: number };
	}

	const DEFAULT_HEADING = 'GeoJSON countries';

	let {
		children,
		heading = DEFAULT_HEADING,
		subheading,
		backHref,
		backLabel,
		wikipedia
	}: Props = $props();
</script>

<UIRoot>
	<main>
		<div class="page-header mb">
			<!--
			A two-column grid: the back button gets its own column, centred on the first row (the h1),
			and both headings share the second column so they always start at the same edge.
		-->
			<div class="heading-grid">
				<div class="back">
					<Button icon="arrow-left" iconPosition="only" href={backHref} aria-label={backLabel} />
				</div>
				<h1 class="page-header__heading">{heading}</h1>
				{#if subheading}
					<p class="page-header__intro page-header__subheading">{subheading}</p>
				{:else if heading === DEFAULT_HEADING}
					<p class="page-header__intro">Browse</p>
				{/if}
			</div>
		</div>

		{@render children()}
	</main>

	<PageFooter {wikipedia} />
</UIRoot>

<style>
	.heading-grid {
		display: grid;
		grid-template-columns: auto 1fr;
		column-gap: 1rem;
	}
	.heading-grid > :global(:not(.back)) {
		grid-column: 2;
	}
	.back {
		grid-column: 1;
		grid-row: 1;
		align-self: center;
	}
	.page-header__subheading {
		text-transform: lowercase;
	}
</style>

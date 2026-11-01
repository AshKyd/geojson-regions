<script lang="ts">
	interface Props {
		/** Plain-text opening paragraph. */
		excerpt: string;
	}

	let { excerpt }: Props = $props();
</script>

<!-- Its CC BY-SA attribution is in the page footer (WikipediaAttribution). -->
<blockquote class="excerpt">{excerpt}</blockquote>

<style>
	.excerpt {
		margin: 0 0 1.5rem;
		line-height: 1.4;
	}
</style>

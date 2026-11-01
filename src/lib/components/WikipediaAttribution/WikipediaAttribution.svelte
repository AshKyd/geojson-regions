<script lang="ts">
	interface Props {
		/** Wikipedia article title. */
		title: string;
		/** Revision of the article the text was taken from. */
		revision: number;
	}

	let { title, revision }: Props = $props();

	const encodedTitle = $derived(encodeURIComponent(title.replaceAll(' ', '_')));
	/** Permanent link to the exact revision quoted, so the text can be checked against its source. */
	const revisionUrl = $derived(
		`https://en.wikipedia.org/w/index.php?title=${encodedTitle}&oldid=${revision}`
	);
	/** CC BY-SA asks for the authors to be credited; Wikipedia's history page lists them. */
	const historyUrl = $derived(
		`https://en.wikipedia.org/w/index.php?title=${encodedTitle}&action=history`
	);
</script>

<p class="p p-narrow">
	The description on this page is shortened from <a href={revisionUrl}>“{title}”</a> on Wikipedia, by
	its <a href={historyUrl}>contributors</a>, under
	<a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>.
</p>

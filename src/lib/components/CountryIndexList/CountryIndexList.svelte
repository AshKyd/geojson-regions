<script lang="ts">
	import { resolve } from '$app/paths';
	import { groupByInitial } from './groupByInitial.ts';

	interface Props {
		/** Every country once; shown grouped by the first letter of its name. */
		countries: { code: string; name: string }[];
	}

	let { countries }: Props = $props();

	const groups = $derived(groupByInitial(countries));
</script>

{#each groups as { initial, items } (initial)}
	<h3>{initial}</h3>
	<ul class="inline-list">
		{#each items as { code, name } (code)}
			<li><a href={resolve('/countries/[country]', { country: code })}>{name}</a></li>
		{/each}
	</ul>
{/each}

<style>
	/* The letters are separators, so they sit back from the countries themselves. */
	h3 {
		margin-top: 2rem;
		opacity: 0.2;
	}
</style>

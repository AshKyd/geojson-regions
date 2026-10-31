<script lang="ts">
	import { Checkbox, Radio, Select } from 'svelte-akui';
	import type { Resolution } from '#lib/utils/countries.ts';

	interface Props {
		/** Level of detail of the downloaded outlines. */
		resolution: Resolution;
		/** Code of the chosen point of view, or "" for Natural Earth's default borders. */
		pov: string;
		/** Point-of-view codes and their display names. */
		povs: Record<string, string>;
		/** Whether every country in the named region is currently selected. */
		isRegionSelected: (regionName: string) => boolean;
		/** Called when a region checkbox is ticked or cleared. */
		onregionchange: (regionName: string, checked: boolean) => void;
	}

	let {
		resolution = $bindable(),
		pov = $bindable(),
		povs,
		isRegionSelected,
		onregionchange
	}: Props = $props();

	const resolutions = [
		{
			value: '110m',
			label: 'Low resolution',
			note: '(110 metre, tiny file, missing detail)'
		},
		{ value: '50m', label: 'Medium resolution', note: '(50 metre)' },
		{ value: '10m', label: 'High resolution', note: '(10 metre, largest file, all details)' }
	];

	// Two fixed columns: the short names sit in the narrow first column, so "North America" gets the flexible one.
	const regionColumns = [
		['All', 'Asia', 'Africa', 'Europe'],
		['North America', 'South America', 'Oceania', 'Other']
	];

	const povOptions = $derived([
		{ value: '', label: 'Natural Earth default (de facto)' },
		...Object.entries(povs)
			.map(([value, label]) => ({ value, label: `${label} POV` }))
			.sort((a, b) => a.label.localeCompare(b.label))
	]);

	// Natural Earth only publishes point-of-view outlines at 10m.
	$effect(() => {
		if (pov) resolution = '10m';
	});
</script>

<div class="col-md-4 resolution">
	<h3>Resolution</h3>
	<p class="p small">How detailed does your map need to be?</p>
	{#each resolutions as { value, label, note }}
		<div class="choice">
			<Radio
				name="resolution"
				bind:group={resolution}
				{value}
				disabled={Boolean(pov) && value !== '10m'}
			>
				<span class="selectagon__main">{label}</span>
				<span class="small">{note}</span>
			</Radio>
		</div>
	{/each}
</div>

<div class="col-md-4 pov-regions">
	<section>
		<h3>Point of view</h3>
		<p class="p small">
			Whose borders should disputed areas follow? Other points of view are only available at high
			resolution.
		</p>
		<Select bind:value={pov} options={povOptions} aria-label="Point of view" />
	</section>

	<section>
		<h3>Regions</h3>
		<p class="p small">Choose from some preset regions</p>
		<div class="regions">
			{#each regionColumns as column}
				<div class="regions__column">
					{#each column as regionName}
						<Checkbox
							label={regionName}
							checked={isRegionSelected(regionName)}
							onchange={(event: Event) =>
								onregionchange(regionName, (event.currentTarget as HTMLInputElement).checked)}
						/>
					{/each}
				</div>
			{/each}
		</div>
	</section>
</div>

<style>
	/* Point of view and regions share one panel so they never split across grid rows. */
	.pov-regions section + section {
		margin-top: 1.5rem;
	}
	.choice {
		padding-bottom: 0.5rem;
	}
	.regions {
		display: flex;
		gap: 0 1rem;
	}
	.regions__column {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	/* akui centres the box against the label; top-align it so it stays beside the first line of wrapped text. */
	.regions__column :global(.akui-choice) {
		align-items: flex-start;
	}
	.regions__column:first-child {
		flex: 0 0 6.5em;
	}
	.regions__column:last-child {
		flex: 1 1 auto;
	}
</style>

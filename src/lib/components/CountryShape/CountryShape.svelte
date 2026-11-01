<script lang="ts">
	import { fade } from 'svelte/transition';
	import { Padding, Tooltip } from 'svelte-akui';
	import { prefersReducedMotion } from 'svelte/motion';
	import MiniMap from '#lib/components/MiniMap/MiniMap.svelte';
	import type { MapPaths } from '#lib/utils/mapTypes.ts';
	import { formatDistance } from '#lib/utils/scaleBar.ts';
	import { SHAPE_HEIGHT, SHAPE_PADDING, SHAPE_WIDTH } from '#lib/utils/shapeFraming.ts';

	interface Props {
		/** The projected map, drawn at build time. */
		map: MapPaths;
		/** The country being shown. */
		target: { code: string; name: string };
		/** Identifies the point of view on screen; when it changes the old map fades out and the new one in. */
		shapeKey: string;
		/** Short name of the graphic: the country and the point of view it is drawn from. */
		title: string;
		/** What the graphic shows, for screen readers and search engines; says nothing about the geography itself. */
		description: string;
	}

	let { map, target, shapeKey, title, description }: Props = $props();
	/** Unique per instance, so the mask below can't clash with another on the page. */
	const maskId = $props.id();

	const width = SHAPE_WIDTH;
	const height = SHAPE_HEIGHT;
	const padding = SHAPE_PADDING;

	const fadeDuration = $derived(prefersReducedMotion.current ? 0 : 300);

	let tooltip = $state({ visible: false, name: '', x: 0, y: 0 });

	/**
	 * Pins the tooltip to the pointer. A shape's own centre can be open ocean (Fiji, Russia are drawn
	 * in pieces) or off the edge of the map (most neighbours are partly out of frame), whereas the
	 * pointer is always over a part that's actually visible.
	 */
	function showTooltip(name: string, { clientX, clientY }: PointerEvent) {
		tooltip = { visible: true, name, x: clientX, y: clientY - 12 };
	}

	const hideTooltip = () => (tooltip.visible = false);
</script>

<!-- The tooltip is fixed to the viewport, so scrolling the page would leave it behind. -->
<svelte:window onscroll={hideTooltip} />

<div class="shape">
	<div class="stack">
		{#key shapeKey}
			<svg
				viewBox="0 0 {width} {height}"
				role="img"
				aria-labelledby="{maskId}-{shapeKey}-title"
				aria-describedby="{maskId}-{shapeKey}-desc"
				in:fade={{ duration: fadeDuration }}
				out:fade={{ duration: fadeDuration }}
			>
				<title id="{maskId}-{shapeKey}-title">{title}</title>
				<desc id="{maskId}-{shapeKey}-desc">{description}</desc>
				<!--
					Borders are masked to the outside of the country rather than just drawn under its fill:
					the fill is see-through in dark mode, so anything beneath it would still show. Strokes
					straddle the edge, so this also keeps the inner half from eating into the shape.
					The id carries the key because the old and new maps are on the page together while fading.
				-->
				<mask id="{maskId}-{shapeKey}" maskUnits="userSpaceOnUse" x="0" y="0" {width} {height}>
					<rect {width} {height} fill="white" />
					<path d={map.target} fill="black" />
				</mask>
				<g mask="url(#{maskId}-{shapeKey})">
					{#each map.neighbours as { code, name, d } (code)}
						<path
							class="neighbour"
							role="img"
							aria-label={name}
							{d}
							onpointermove={(event) => showTooltip(name, event)}
							onpointerleave={hideTooltip}
						/>
					{/each}
					<path class="border" d={map.target} />
				</g>
				<path
					class="target"
					role="img"
					aria-label={target.name}
					d={map.target}
					onpointermove={(event) => showTooltip(target.name, event)}
					onpointerleave={hideTooltip}
				/>
				{#if map.scale}
					<!-- Bottom-right scale bar, true east-west at the country's latitude. -->
					<g
						class="scale"
						transform="translate({width - padding - map.scale.pixels} {height - padding})"
					>
						<title>Scale at the country's latitude</title>
						<path d="M0 -6 V0 H{map.scale.pixels} V-6" />
						<text x={map.scale.pixels} y="-12" text-anchor="end"
							>{formatDistance(map.scale.km)}</text
						>
					</g>
				{/if}
			</svg>
		{/key}
	</div>
	<div class="minimap">
		<MiniMap centre={map.centre} code={target.code} />
	</div>
	<Tooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y} position="top">
		<Padding size="s">{tooltip.name}</Padding>
	</Tooltip>
</div>

<style>
	.shape {
		position: relative;
		overflow: hidden;
	}
	/* Top-left corner, decorative: it must not block the tooltip's hover on the shape beneath. */
	.minimap {
		position: absolute;
		top: 0.75rem;
		left: 0.75rem;
		width: min(10rem, 30%);
		pointer-events: none;
	}
	svg {
		display: block;
		width: 100%;
		height: auto;
	}
	/* The old and new maps share one cell, so they cross-fade in place. */
	.stack {
		display: grid;
	}
	.stack > svg {
		grid-area: 1 / 1;
	}
	path {
		vector-effect: non-scaling-stroke;
		pointer-events: none;
	}
	.scale path {
		fill: none;
		stroke: white;
		stroke-width: 2px;
	}
	.scale text {
		fill: white;
		font-size: 16px;
		/* A dark halo keeps the label readable on any background. */
		paint-order: stroke;
		stroke: #000a;
		stroke-width: 3px;
		pointer-events: none;
	}
	/* Neighbours are context: a barely-there fill and a hairline border, with a name on hover. */
	.neighbour,
	.border {
		stroke: white;
		stroke-linejoin: round;
	}
	.neighbour {
		fill: rgb(255 255 255 / 0.08);
		stroke-width: 0.5px;
		pointer-events: auto;
	}
	/* The mask hides the inner half of the main country's border, so 4px here shows as 2px. */
	.border {
		fill: none;
		stroke-width: 4px;
	}
	.target {
		pointer-events: auto;
		fill: var(--map-link-selected);
		stroke: none;
	}
</style>

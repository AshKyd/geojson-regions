<script lang="ts">
  import { geoEqualEarth, geoPath } from "d3-geo";
  import { select } from "d3-selection";
  import { Padding, Tooltip } from "svelte-akui";
  import { untrack } from "svelte";
  import { zoom, type ZoomTransform } from "d3-zoom";
  import type { SvelteSet } from "svelte/reactivity";
  import { featureFilename, featureName } from "#lib/utils/countries.ts";
  import { allowsMapGesture, MAX_ZOOM } from "#lib/utils/mapZoom.ts";
  import { largestPart, nearestPart, polygonParts, type Bounds } from "#lib/utils/mapParts.ts";

  interface Props {
    /** Country features from an `all.geojson` file. */
    features: GeoJSON.Feature[];
    /** Filenames of the countries the user has selected. */
    selected: SvelteSet<string>;
  }

  let { features, selected }: Props = $props();

  // Equal Earth is 2.057:1; sizing the viewBox to match avoids dead space around the globe.
  const width = 960;
  const height = Math.round(width / 2.057);
  const projection = geoEqualEarth().fitSize([width, height], { type: "Sphere" });
  const pathFor = geoPath(projection);

  // The map first opens cropped to start at Canada (-141° is the Alaska–Yukon border), hiding the
  // empty Pacific. It's only the initial view: the pan limits below still cover the whole world.
  const INITIAL_LEFT_LONGITUDE = -141;
  const [cropLeft = 0] = projection([INITIAL_LEFT_LONGITUDE, 0]) ?? [];
  const viewWidth = width - cropLeft;

  /** Current pan and zoom, applied to the group holding every country. */
  let transform = $state<Pick<ZoomTransform, "x" | "y" | "k">>({ x: 0, y: 0, k: 1 });
  /** Shown briefly when someone drags the map with one finger, since that scrolls the page. */
  let showTwoFingerHint = $state(false);

  let svgElement = $state<SVGSVGElement>();
  let zoomGroup = $state<SVGGElement>();
  /** The part of the hovered country the tooltip sits over, in map (pre-zoom) coordinates. */
  let hoveredPart: Bounds | undefined;
  let tooltip = $state({ visible: false, name: "", x: 0, y: 0 });

  /**
   * Pins the tooltip above the hovered part of a country. The part's on-screen box is clipped to the
   * map first, so one that's partly panned out of view still gets a tooltip over its visible portion.
   */
  function placeTooltip() {
    const matrix = zoomGroup?.getScreenCTM();
    if (!hoveredPart || !svgElement || !matrix) return;
    const [[x0, y0], [x1, y1]] = hoveredPart;
    const topLeft = new DOMPoint(x0, y0).matrixTransform(matrix);
    const bottomRight = new DOMPoint(x1, y1).matrixTransform(matrix);
    const map = svgElement.getBoundingClientRect();
    const left = Math.max(topLeft.x, map.left);
    const right = Math.min(bottomRight.x, map.right);
    const top = Math.max(topLeft.y, map.top);
    const bottom = Math.min(bottomRight.y, map.bottom);
    if (right <= left || bottom <= top) {
      tooltip.visible = false;
      return;
    }
    tooltip.x = (left + right) / 2;
    tooltip.y = top - 6;
    tooltip.visible = true;
  }

  /**
   * Shows the tooltip over one landmass of a country. Countries that cross the antimeridian (Fiji,
   * Russia, the USA) are drawn in pieces at opposite edges of the map, so the whole country's box
   * would put the tooltip in the middle of the ocean. With a pointer position we pick the nearest
   * piece; for keyboard focus we use the biggest.
   */
  function showTooltip(name: string, parts: Bounds[], pointer?: { clientX: number; clientY: number }) {
    const matrix = zoomGroup?.getScreenCTM();
    if (!name || !matrix) return;
    const mapPointer = pointer && new DOMPoint(pointer.clientX, pointer.clientY).matrixTransform(matrix.inverse());
    hoveredPart = mapPointer
      ? nearestPart(parts, [mapPointer.x, mapPointer.y])
      : largestPart(parts);
    tooltip.name = name;
    placeTooltip();
  }

  function hideTooltip() {
    hoveredPart = undefined;
    tooltip.visible = false;
  }

  // Keep the tooltip on its country while the map pans and zooms underneath it.
  $effect(() => {
    void [transform.x, transform.y, transform.k];
    untrack(placeTooltip);
  });

  /** Wires up d3-zoom on the svg. Panning is clamped to the whole world so it can't be dragged away. */
  function panAndZoom(svg: SVGSVGElement) {
    const visible: [[number, number], [number, number]] = [
      [cropLeft, 0],
      [width, height],
    ];
    const world: [[number, number], [number, number]] = [
      [0, 0],
      [width, height],
    ];
    const behaviour = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_ZOOM])
      .extent(visible)
      .translateExtent(world)
      .filter(allowsMapGesture)
      .on("zoom", ({ transform: next }) => (transform = next));
    select(svg).call(behaviour);
    // d3 sets `touch-action: none`, which would stop one-finger scrolling. Allow native scrolling
    // and let d3 cancel it only once a two-finger gesture begins.
    svg.style.touchAction = "pan-x pan-y";

    let hintTimer: ReturnType<typeof setTimeout>;
    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      showTwoFingerHint = true;
      clearTimeout(hintTimer);
      hintTimer = setTimeout(() => (showTwoFingerHint = false), 1500);
    };
    svg.addEventListener("touchmove", onTouchMove, { passive: true });

    return () => {
      select(svg).on(".zoom", null);
      svg.removeEventListener("touchmove", onTouchMove);
      clearTimeout(hintTimer);
    };
  }

  const countries = $derived(
    features.map((feature) => ({
      filename: featureFilename(feature.properties ?? {}),
      name: featureName(feature.properties ?? {}),
      outline: pathFor(feature) ?? "",
      parts: polygonParts(feature.geometry).map((part) => pathFor.bounds(part)),
    })),
  );

  function toggle(filename: string) {
    if (selected.has(filename)) selected.delete(filename);
    else selected.add(filename);
  }
</script>

<!-- The tooltip is fixed to the viewport, so scrolling the page would leave it behind. -->
<svelte:window onscroll={hideTooltip} />

<div class="map" style="padding-bottom: {(height / viewWidth) * 100}%">
  <svg
    viewBox="{cropLeft} 0 {viewWidth} {height}"
    role="group"
    aria-label="World map"
    bind:this={svgElement}
    {@attach panAndZoom}
  >
    <g bind:this={zoomGroup} transform="translate({transform.x} {transform.y}) scale({transform.k})">
    <!-- Unkeyed: a few outlines share a filename in some points of view. -->
    {#each countries as { filename, name, outline, parts }}
      <path
        d={outline}
        class:selected={selected.has(filename)}
        role="button"
        tabindex="0"
        aria-pressed={selected.has(filename)}
        aria-label={name}
        onclick={() => toggle(filename)}
        onpointermove={(event) => {
          // Touch has no hover; a tap would leave the tooltip stuck on screen.
          if (event.pointerType !== "touch") showTooltip(name, parts, event);
        }}
        onpointerleave={hideTooltip}
        onfocus={() => showTooltip(name, parts)}
        onblur={hideTooltip}
        onkeydown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle(filename);
          }
        }}
      />
    {/each}
    </g>
  </svg>
  <Tooltip visible={tooltip.visible} x={tooltip.x} y={tooltip.y} position="top">
    <Padding size="s">{tooltip.name}</Padding>
  </Tooltip>
  {#if showTwoFingerHint}
    <p class="hint" role="status">Use two fingers to move the map</p>
  {/if}
</div>

<style>
  /* Fixed-ratio box (the viewBox's aspect ratio) so the map is sized before the paths arrive. */
  .map {
    position: relative;
    height: 0;
    width: 100%;
    stroke-width: calc(1rem / 16);
  }
  svg {
    position: absolute;
    width: 100%;
    height: 100%;
    vector-effect: non-scaling-stroke;
  }
  path {
    /* Keep outlines hairline-thin however far the map is zoomed. */
    vector-effect: non-scaling-stroke;
    fill: var(--map-link);
    stroke: var(--map-link-stroke);
    transition: fill 0.1s;
    cursor: pointer;
  }
  .hint {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    background: #000a;
    color: white;
    pointer-events: none;
  }
  path:hover {
    fill: var(--map-link-hover);
  }
  path.selected {
    fill: var(--map-link-selected);
  }
</style>

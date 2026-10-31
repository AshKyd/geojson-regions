<script lang="ts">
  import { geoEqualEarth, geoPath } from "d3-geo";
  import { select } from "d3-selection";
  import { zoom, type ZoomTransform } from "d3-zoom";
  import type { SvelteSet } from "svelte/reactivity";
  import { featureFilename, featureName } from "#lib/utils/countries.ts";
  import { allowsMapGesture, MAX_ZOOM } from "#lib/utils/mapZoom.ts";

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
    })),
  );

  function toggle(filename: string) {
    if (selected.has(filename)) selected.delete(filename);
    else selected.add(filename);
  }
</script>

<div class="map" style="padding-bottom: {(height / viewWidth) * 100}%">
  <svg
    viewBox="{cropLeft} 0 {viewWidth} {height}"
    role="group"
    aria-label="World map"
    {@attach panAndZoom}
  >
    <g transform="translate({transform.x} {transform.y}) scale({transform.k})">
    <!-- Unkeyed: a few outlines share a filename in some points of view. -->
    {#each countries as { filename, name, outline }}
      <path
        d={outline}
        class:selected={selected.has(filename)}
        role="button"
        tabindex="0"
        aria-pressed={selected.has(filename)}
        aria-label={name}
        onclick={() => toggle(filename)}
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

import { geoBounds, geoCentroid, geoOrthographic } from 'd3-geo';
import type { GeoBox } from '#lib/utils/geoBoxes.ts';

export const SHAPE_WIDTH = 960;
export const SHAPE_HEIGHT = 540;
export const SHAPE_PADDING = 24;

/** Longitude span, in degrees, beyond which a shape is treated as wrapping all the way round. */
const POLAR_WRAP_SPAN = 359;
/** Absolute latitude a wrapping shape must reach to count as sitting on a pole. */
const POLE_REACH_LATITUDE = 85;

/**
 * [longitude, latitude] to turn the globe to. Normally the shape's centroid, but a shape that wraps
 * a pole (Antarctica spans every longitude) has a centroid that drifts off the pole depending on
 * how its outline is cut at ±180°, so it's centred on the pole itself.
 */
export const globeCentre = (feature: GeoJSON.Feature): [number, number] => {
	const [[west = 0, south = 0], [east = 0, north = 0]] = geoBounds(feature);
	const reachesSouthPole = south <= -POLE_REACH_LATITUDE;
	const reachesNorthPole = north >= POLE_REACH_LATITUDE;
	// A box that merely crosses the antimeridian has west > east, so only a full span counts.
	const wrapsPole = east - west >= POLAR_WRAP_SPAN && (reachesSouthPole || reachesNorthPole);
	if (!wrapsPole) return geoCentroid(feature) as [number, number];
	return [0, reachesSouthPole ? -90 : 90];
};

/**
 * The projection a country's page draws its map with: a globe turned to put the country's centre in
 * the middle, then framed to fill the view. The server uses this too, to know which neighbours fall
 * in view (points on the far side of the globe project to null). Other sizes, such as the 1200×630
 * social image, frame the same way into their own box.
 */
export const framingProjection = (
	feature: GeoJSON.Feature,
	{
		width = SHAPE_WIDTH,
		height = SHAPE_HEIGHT,
		padding = SHAPE_PADDING
	}: { width?: number; height?: number; padding?: number } = {}
) => {
	const [longitude, latitude] = globeCentre(feature);
	return geoOrthographic()
		.rotate([-longitude, -latitude])
		.fitExtent(
			[
				[padding, padding],
				[width - padding, height - padding]
			],
			feature
		);
};

/** Scale (globe radius) when the whole globe just fits the map's height; a country's zoom is measured against it. */
const WORLD_SCALE = (SHAPE_HEIGHT - 2 * SHAPE_PADDING) / 2;

/**
 * How detailed the neighbours should be. The further the map is zoomed into a country the bigger
 * its neighbours' borders look on screen, so fine detail is worth having; zoomed out, a map full of
 * 10m outlines is slow to draw and the extra detail is smaller than a pixel.
 */
export const neighbourResolution = (projection: { scale: () => number }) => {
	const zoom = projection.scale() / WORLD_SCALE;
	if (zoom >= 20) return '10m';
	if (zoom >= 6) return '50m';
	return '110m';
};

/** Points per edge when outlining a box; enough to follow the projection's curved meridians. */
const SAMPLES_PER_EDGE = 12;

/**
 * Whether any part of a geographic box lands inside the map. The box's edges are projected rather
 * than just its corners, since the globe curves meridians; being slightly generous is fine, as a
 * shape that only just misses the view costs nothing to draw.
 */
export const isBoxInView = ({
	box: [[west, south], [east, north]],
	project,
	width = SHAPE_WIDTH,
	height = SHAPE_HEIGHT
}: {
	box: GeoBox;
	project: (point: [number, number]) => [number, number] | null;
	/** Size of the view the projection frames; the page's map by default. */
	width?: number;
	height?: number;
}) => {
	// A box crossing the antimeridian has west > east; unwrap it so the edge samples run the short way.
	const unwrappedEast = west <= east ? east : east + 360;
	const steps = Array.from({ length: SAMPLES_PER_EDGE + 1 }, (_, step) => step / SAMPLES_PER_EDGE);
	const longitudes = steps.map((fraction) => west + (unwrappedEast - west) * fraction);
	const latitudes = steps.map((fraction) => south + (north - south) * fraction);
	const edge: [number, number][] = [
		...longitudes.flatMap((longitude): [number, number][] => [
			[longitude, south],
			[longitude, north]
		]),
		...latitudes.flatMap((latitude): [number, number][] => [
			[west, latitude],
			[unwrappedEast, latitude]
		])
	];
	const projected = edge
		.map((point) => project(point))
		.filter((point): point is [number, number] => point !== null);
	if (projected.length === 0) return false;
	const xs = projected.map(([x]) => x);
	const ys = projected.map(([, y]) => y);
	return (
		Math.min(...xs) <= width &&
		Math.max(...xs) >= 0 &&
		Math.min(...ys) <= height &&
		Math.max(...ys) >= 0
	);
};

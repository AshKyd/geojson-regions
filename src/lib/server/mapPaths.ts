import { geoPath, type GeoPermissibleObjects, type GeoProjection } from 'd3-geo';
import { countriesDirectory, outlinesDirectory, readJson } from '#lib/server/outlineFiles.ts';
import { featureFilename, type Resolution } from '#lib/utils/countries.ts';
import type { MapPaths } from '#lib/utils/mapTypes.ts';
import { scaleBarAt } from '#lib/utils/scaleBar.ts';
import { simplifyPath } from '#lib/utils/simplifyPath.ts';

interface Shape {
	code: string;
	name: string;
}

/** Longest the scale bar may be, in map pixels. */
const SCALE_BAR_MAX_PIXELS = 160;

/** The 110m world file's features, keyed by the filename each would have as its own file. */
let worldIndex: Promise<Map<string, GeoJSON.Feature>> | undefined;

const lightWorld = () =>
	(worldIndex ??= readJson<GeoJSON.FeatureCollection>(
		`${countriesDirectory}/110m/all.geojson`
	).then(
		(collection) =>
			new Map(
				collection.features.map((feature) => [featureFilename(feature.properties ?? {}), feature])
			)
	));

/**
 * One neighbour's outline. Zoomed out they come from the 110m world file, and any it lacks are left
 * off. Zoomed in, the finer file is read (this point of view's own at 10m, so shared borders line up
 * with the target's), falling back to the 110m shape if there isn't one.
 */
const neighbourFeature = async ({
	code,
	resolution,
	pov
}: {
	code: string;
	resolution: Resolution;
	pov: string;
}) => {
	const light = (await lightWorld()).get(`${code}.geojson`);
	if (resolution === '110m') return light;
	const folder = resolution === '10m' ? outlinesDirectory(pov) : resolution;
	const detailed = await readJson<GeoJSON.Feature>(
		`${countriesDirectory}/${folder}/${code}.geojson`
	).catch(() => undefined);
	return detailed ?? light;
};

/**
 * Projects a country and its neighbours into SVG path strings at build time. The map is static, so
 * this runs once per page during prerender and the browser only has to draw the result.
 */
export const buildMapPaths = async ({
	pov,
	targetFeature,
	projection,
	centre,
	neighbours,
	resolution
}: {
	pov: string;
	targetFeature: GeoJSON.Feature;
	projection: GeoProjection;
	centre: [number, number];
	neighbours: Shape[];
	resolution: Resolution;
}): Promise<MapPaths> => {
	const pathFor = geoPath(projection).digits(1);
	const toPath = (shape: GeoPermissibleObjects) => simplifyPath(pathFor(shape) ?? '');
	const features = await Promise.all(
		neighbours.map(async (shape) => ({
			...shape,
			feature: await neighbourFeature({ code: shape.code, resolution, pov })
		}))
	);
	return {
		globe: toPath({ type: 'Sphere' }),
		target: toPath(targetFeature),
		// A neighbour whose box reaches into view can still draw nothing (round the back of the globe,
		// or thinned away), so those are left out rather than shipped as empty paths.
		neighbours: features
			.flatMap(({ code, name, feature }) => (feature ? [{ code, name, d: toPath(feature) }] : []))
			.filter(({ d }) => d !== ''),
		centre,
		scale: scaleBarAt({
			project: (point) => projection(point),
			centre,
			maxPixels: SCALE_BAR_MAX_PIXELS
		})
	};
};

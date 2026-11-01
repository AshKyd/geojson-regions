import { geoDistance } from 'd3-geo';

const EARTH_RADIUS_KM = 6371;

/** Largest "round" distance (1, 2 or 5 times a power of ten) that doesn't exceed `maxKm`. */
export const niceDistanceKm = (maxKm: number) => {
	const base = 10 ** Math.floor(Math.log10(maxKm));
	return [5, 2, 1].map((multiple) => multiple * base).find((km) => km <= maxKm) ?? base;
};

/** "500 km", or "200 m" for short distances. */
export const formatDistance = (km: number) =>
	km >= 1 ? `${km.toLocaleString('en-AU')} km` : `${Math.round(km * 1000)} m`;

/**
 * Sizes a scale bar for a map projection at one place.
 * A projection stretches distances differently across the map, so the bar is only true east-west
 * at the latitude of `centre`: we measure a short step along that parallel and scale from it.
 * `maxPixels` caps the bar's length on screen.
 */
export const scaleBarAt = ({
	project,
	centre: [longitude, latitude],
	maxPixels
}: {
	project: (point: [number, number]) => [number, number] | null;
	centre: [number, number];
	maxPixels: number;
}) => {
	// Stay off the poles, where a degree of longitude shrinks to nothing.
	const safeLatitude = Math.max(-85, Math.min(85, latitude));
	const west: [number, number] = [longitude - 0.25, safeLatitude];
	const east: [number, number] = [longitude + 0.25, safeLatitude];
	const [projectedWest, projectedEast] = [project(west), project(east)];
	if (!projectedWest || !projectedEast) return undefined;
	const pixels = Math.hypot(
		projectedEast[0] - projectedWest[0],
		projectedEast[1] - projectedWest[1]
	);
	const pixelsPerKm = pixels / (geoDistance(west, east) * EARTH_RADIUS_KM);
	const km = niceDistanceKm(maxPixels / pixelsPerKm);
	return { km, pixels: km * pixelsPerKm };
};

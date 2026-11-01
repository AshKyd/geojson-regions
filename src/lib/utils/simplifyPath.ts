/** Pixel distance below which a point adds nothing the eye can see on the 960px-wide map. */
export const SIMPLIFY_TOLERANCE_PX = 0.5;

/** Smallest number of points that still makes a ring with any area. */
const MIN_RING_POINTS = 3;

type Point = readonly [number, number];

/**
 * Thins a projected SVG path by dropping each point within `tolerance` pixels of the last one kept.
 * Outlines are far denser than the screen needs once fitted to the map, so this cuts the path to a
 * third or less without changing how it looks. Rings that shrink below a triangle (islands smaller
 * than a pixel) are dropped, since they could not be seen anyway.
 * Expects the `M x,y L x,y … Z` form that d3's `geoPath` produces.
 */
export const simplifyPath = (path: string, tolerance = SIMPLIFY_TOLERANCE_PX) =>
	(path.match(/M[^M]*/g) ?? [])
		.flatMap((ring) => {
			const points = [...ring.matchAll(/(-?[\d.]+),(-?[\d.]+)/g)].map(
				([, x = '0', y = '0']): Point => [Number(x), Number(y)]
			);
			const kept = points.reduce<Point[]>((thinned, point) => {
				const last = thinned.at(-1);
				if (!last || Math.hypot(point[0] - last[0], point[1] - last[1]) >= tolerance)
					thinned.push(point);
				return thinned;
			}, []);
			if (kept.length < MIN_RING_POINTS) return [];
			const closed = ring.trimEnd().endsWith('Z') ? 'Z' : '';
			return [`M${kept.map(([x, y]) => `${x},${y}`).join('L')}${closed}`];
		})
		.join('');

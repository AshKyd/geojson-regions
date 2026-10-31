/** A box in map coordinates: [[left, top], [right, bottom]]. */
export type Bounds = [[number, number], [number, number]];

/** Splits a geometry into its separate polygons, so each landmass can be measured on its own. */
export const polygonParts = (geometry: GeoJSON.Geometry | null) => {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry];
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.map(
      (coordinates): GeoJSON.Polygon => ({ type: "Polygon", coordinates }),
    );
  }
  return [];
};

const area = ([[x0, y0], [x1, y1]]: Bounds) => (x1 - x0) * (y1 - y0);

/** The part with the biggest box, or undefined if there are none. */
export const largestPart = (parts: Bounds[]) =>
  parts.reduce<Bounds | undefined>(
    (largest, part) => (!largest || area(part) > area(largest) ? part : largest),
    undefined,
  );

/** Distance from a point to a box; 0 when the point is inside it. */
const distanceToBox = ([x, y]: [number, number], [[x0, y0], [x1, y1]]: Bounds) =>
  Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(y0 - y, 0, y - y1));

/** The part whose box is closest to the point, e.g. the island under the pointer. */
export const nearestPart = (parts: Bounds[], point: [number, number]) =>
  parts.reduce<Bounds | undefined>(
    (nearest, part) =>
      !nearest || distanceToBox(point, part) < distanceToBox(point, nearest) ? part : nearest,
    undefined,
  );

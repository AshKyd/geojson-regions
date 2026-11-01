/** [[west, south], [east, north]] in degrees, as d3's `geoBounds` returns. West > east means it crosses the antimeridian. */
export type GeoBox = [[number, number], [number, number]];

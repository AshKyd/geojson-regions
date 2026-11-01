/** Everything needed to draw a country's map as SVG, projected and thinned at build time. */
export interface MapPaths {
	/** The globe's disc. */
	globe: string;
	/** The country itself. */
	target: string;
	/** Surrounding countries, drawn only as context. */
	neighbours: { code: string; name: string; d: string }[];
	/** [longitude, latitude] the globe is turned to; also marks the country on the minimap. */
	centre: [number, number];
	/** Length of the scale bar, in kilometres and in map pixels; absent if it can't be measured. */
	scale?: { km: number; pixels: number };
}

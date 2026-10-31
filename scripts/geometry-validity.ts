import GeoJSONReader from "jsts/org/locationtech/jts/io/GeoJSONReader.js";
import IsValidOp from "jsts/org/locationtech/jts/operation/valid/IsValidOp.js";

const reader = new GeoJSONReader();

/**
 * Finds features whose geometry breaks the OGC validity rules (self-intersections, spikes, rings
 * that touch themselves). Natural Earth publishes a few, e.g. the 110m Sudan polygon, and tools
 * like Shapely's `polylabel` reject them. This only reports; the geometry is left as published.
 * Returns each offender's position in `features` and the reason JTS gives.
 */
export const findInvalidGeometries = (
  features: { geometry: unknown }[],
): { position: number; reason: string }[] =>
  features.flatMap(({ geometry }, position) => {
    const error = new IsValidOp(reader.read(geometry as never)).getValidationError();
    return error ? [{ position, reason: String(error) }] : [];
  });

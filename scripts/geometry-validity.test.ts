import { describe, expect, it } from "vitest";
import { findInvalidGeometries } from "./geometry-validity.ts";

const square = { type: "Polygon", coordinates: [[[0, 0], [2, 0], [2, 2], [0, 2], [0, 0]]] };
const bowtie = { type: "Polygon", coordinates: [[[0, 0], [2, 2], [2, 0], [0, 2], [0, 0]]] };

describe("findInvalidGeometries", () => {
  it("reports nothing for valid polygons", () => {
    expect(findInvalidGeometries([{ geometry: square }])).toEqual([]);
  });

  it("reports the position and reason for a self-intersecting polygon", () => {
    const [result] = findInvalidGeometries([{ geometry: square }, { geometry: bowtie }]);
    expect(result?.position).toBe(1);
    expect(result?.reason).toMatch(/self-intersection/i);
  });
});

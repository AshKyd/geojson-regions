import { describe, expect, it } from "vitest";
import {
  downloadUrls,
  featureFilename,
  MAP_OUTLINES_URL,
  outlinesPath,
  regionFilenames,
  type CountryIndex,
} from "./countries.ts";

const index: CountryIndex = {
  all: {
    AUS: { filename: "AUS.geojson", countryName: "Australia" },
    NZL: { filename: "NZL.geojson", countryName: "New Zealand" },
  },
  Oceania: { Australia: "AUS.geojson", "New Zealand": "NZL.geojson" },
  Antarctica: { Antarctica: "ATA.geojson" },
  "Seven seas (open ocean)": { Seas: "SEA.geojson" },
};

describe("outlinesPath", () => {
  it("uses the resolution for default outlines", () => {
    expect(outlinesPath({ resolution: "50m" })).toBe("/countries/50m");
  });
  it("forces 10m for a point of view", () => {
    expect(outlinesPath({ resolution: "50m", pov: "ind" })).toBe(
      "/countries/pov/ind/10m",
    );
  });
});

describe("MAP_OUTLINES_URL", () => {
  it("is always the 110m set, whatever the point of view", () => {
    expect(MAP_OUTLINES_URL).toBe("/countries/110m/all.geojson");
  });
});

describe("regionFilenames", () => {
  it("lists a continent", () => {
    expect(regionFilenames(index, "Oceania")).toEqual([
      "AUS.geojson",
      "NZL.geojson",
    ]);
  });
  it("lists every country for All", () => {
    expect(regionFilenames(index, "All")).toEqual([
      "AUS.geojson",
      "NZL.geojson",
    ]);
  });
  it("merges Antarctica and the open ocean for Other", () => {
    expect(regionFilenames(index, "Other")).toEqual([
      "ATA.geojson",
      "SEA.geojson",
    ]);
  });
});

describe("downloadUrls", () => {
  it("drops countries missing from the chosen outlines", () => {
    expect(
      downloadUrls({
        selected: new Set(["AUS.geojson", "XXX.geojson"]),
        index,
        basePath: "/countries/10m",
      }),
    ).toEqual(["/countries/10m/AUS.geojson"]);
  });
});

describe("featureFilename", () => {
  it("prefers the filename property", () => {
    expect(featureFilename({ filename: "AUS.geojson", ISO_A3: "XXX" })).toBe("AUS.geojson");
  });

  it("derives it from legacy uppercase columns", () => {
    expect(featureFilename({ ISO_A3: "FJI", GU_A3: "FJI" })).toBe("FJI.geojson");
  });

  it("falls back to the Geounit code when the ISO code is -99", () => {
    expect(featureFilename({ ISO_A3: "-99", GU_A3: "SOL" })).toBe("SOL.geojson");
  });
});

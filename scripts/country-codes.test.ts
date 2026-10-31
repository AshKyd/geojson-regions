import { describe, expect, it } from "vitest";
import { assignCodes, countryCode } from "./country-codes.ts";

describe("countryCode", () => {
  it("uses the ISO code when there is one", () => {
    expect(countryCode({ iso_a3: "AUS", gu_a3: "AUS", type: "Sovereign country", name: "Australia" })).toBe("AUS");
  });

  it("uses the Geounit code for countries without an ISO code", () => {
    expect(countryCode({ iso_a3: "-99", gu_a3: "SOL", type: "Country", name: "Somaliland" })).toBe("SOL");
  });

  it("slugs the name for other disputed areas", () => {
    expect(countryCode({ iso_a3: "-99", type: "Disputed", name: "Bir Tawil" })).toBe("birtawil");
  });

  it("falls back to an adm0_a3 column when there is no name", () => {
    expect(countryCode({ iso_a3: "", name: "", adm0_a3_ru: "B38", featurecla: "Admin-0 country" })).toBe("b38");
  });
});

describe("assignCodes", () => {
  it("leaves unique codes untouched", () => {
    expect(
      assignCodes([
        { iso_a3: "AUS", name: "Australia" },
        { iso_a3: "NZL", name: "New Zealand" },
      ]),
    ).toEqual(["AUS", "NZL"]);
  });

  it("gives every feature sharing a code its own name-based filename", () => {
    expect(
      assignCodes([
        { iso_a3: "BES", name: "Saba" },
        { iso_a3: "AUS", name: "Australia" },
        { iso_a3: "BES", name: "Sint Eustatius" },
        { iso_a3: "BES", name: "Bonaire" },
      ]),
    ).toEqual(["BES-saba", "AUS", "BES-sinteustatius", "BES-bonaire"]);
  });

  it("numbers shared codes that have no name", () => {
    expect(
      assignCodes([
        { iso_a3: "", name: "", adm0_a3_ru: "B38" },
        { iso_a3: "", name: "", adm0_a3_ru: "B38" },
        { iso_a3: "", name: "", adm0_a3_ru: "B40" },
      ]),
    ).toEqual(["b38-1", "b38-2", "b40"]);
  });

  it("never returns the same code twice", () => {
    const codes = assignCodes([
      { iso_a3: "BES", name: "Saba" },
      { iso_a3: "BES", name: "Saba" },
    ]);
    expect(new Set(codes).size).toBe(2);
  });
});

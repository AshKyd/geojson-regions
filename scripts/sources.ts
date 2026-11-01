/** Natural Earth's official S3 mirror. The naturalearthdata.com download URLs are unreliable. */
const BASE_URL = "https://naturalearth.s3.amazonaws.com";

export interface CountrySource {
  /** Where the zipped shapefile is downloaded from. */
  url: string;
  /** Output folder, relative to the countries root. */
  outputPath: string;
}

export const RESOLUTIONS = ["110m", "50m", "10m"] as const;

/**
 * Point-of-view variants. Natural Earth only publishes these at 10m.
 * They show borders according to de jure claims of the named country, or alliance.
 */
export const POINTS_OF_VIEW: Record<string, string> = {
  arg: "Argentina",
  bdg: "Bangladesh",
  bra: "Brazil",
  chn: "China",
  egy: "Egypt",
  fra: "France",
  deu: "Germany",
  grc: "Greece",
  idn: "Indonesia",
  ind: "India",
  iso: "ISO",
  isr: "Israel",
  ita: "Italy",
  jpn: "Japan",
  kor: "South Korea",
  mar: "Morocco",
  nep: "Nepal",
  nld: "Netherlands",
  pak: "Pakistan",
  pol: "Poland",
  prt: "Portugal",
  pse: "Palestine",
  rus: "Russia",
  sau: "Saudi Arabia",
  esp: "Spain",
  swe: "Sweden",
  tur: "Turkey",
  twn: "Taiwan",
  gbr: "United Kingdom",
  usa: "United States",
  ukr: "Ukraine",
  vnm: "Vietnam",
};

const zipUrl = (resolution: string, suffix = "") =>
  `${BASE_URL}/${resolution}_cultural/ne_${resolution}_admin_0_countries${suffix}.zip`;

export const COUNTRY_SOURCES: CountrySource[] = [
  ...RESOLUTIONS.map((resolution) => ({
    url: zipUrl(resolution),
    outputPath: resolution,
  })),
  ...Object.keys(POINTS_OF_VIEW).map((code) => ({
    url: zipUrl("10m", `_${code}`),
    outputPath: `pov/${code}/10m`,
  })),
];

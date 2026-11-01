import { geoAzimuthalEqualArea, geoPath } from 'd3-geo';
import { globeCentre } from '#lib/utils/shapeFraming.ts';

/** Size, in SVG units, of the square the outline is fitted into before the viewBox is trimmed to it. */
const FIT_SIZE = 1000;

/** Where an outline came from and which view of the borders it draws; written into the file. */
export interface OutlineInfo {
	countryName: string;
	/** Filename code of the country, e.g. "CHN". */
	countryCode: string;
	/** Name of the point of view, e.g. "Argentina"; Natural Earth's own de facto borders are `isDeFacto`. */
	povName: string;
	povSlug: string;
	/** True for Natural Earth's own borders (who controls the territory) rather than a country's view. */
	isDeFacto: boolean;
	/** Every country that draws the borders this way, when several share the view. */
	sharedWith?: string[];
	/** Page this outline belongs to. */
	pageUrl: string;
}

const escapeXml = (text: string) =>
	text.replace(/[&<>"]/g, (character) => `&#${character.charCodeAt(0)};`);

/** `<title>`, `<desc>` and Dublin Core `<metadata>`, so a loose file still says what it is. */
const infoMarkup = ({ info, centre }: { info: OutlineInfo; centre: [number, number] }) => {
	const { countryName, countryCode, povName, povSlug, isDeFacto, sharedWith, pageUrl } = info;
	const view = isDeFacto
		? "Natural Earth's de facto borders (borders according to who controls the territory)"
		: `the ${povName} point of view (borders as ${sharedWith?.join(', ') ?? povName} draws them)`;
	const title = isDeFacto
		? `${countryName} (de facto borders)`
		: `${countryName} according to ${povName}`;
	const description = `Outline of ${countryName} (${countryCode}) in ${view}. Source: Natural Earth, public domain. Projection: Lambert azimuthal equal-area centred on ${centre.map((degrees) => degrees.toFixed(2)).join(', ')} (longitude, latitude). No colours are applied; colour it as you like.`;
	const [t, d] = [title, description].map(escapeXml);
	const fields = [
		['dc:title', title],
		['dc:description', description],
		['dc:source', 'Natural Earth (https://www.naturalearthdata.com)'],
		['dc:publisher', pageUrl],
		['dc:rights', 'Public domain'],
		['dc:identifier', `${countryCode}${isDeFacto ? '' : `-${povSlug}`}`],
		['dc:coverage', countryName]
	]
		.map(([tag, value]) => `<${tag}>${escapeXml(value ?? '')}</${tag}>`)
		.join('');
	return `<title>${t}</title><desc>${d}</desc><metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description rdf:about="${escapeXml(pageUrl)}">${fields}</rdf:Description></rdf:RDF></metadata>`;
};

/**
 * A country as a standalone, unstyled SVG: one `<path>` with no fill, stroke or class, so whoever
 * uses it decides how it looks. With `info`, the file also says where it came from and which point
 * of view it draws.
 *
 * Lambert azimuthal equal-area, centred on the country: it keeps area true, distorts least at the
 * centre, and (unlike Mercator) copes with poles, the antimeridian and high latitudes, so one choice
 * suits every country.
 */
export const featureToSvg = (feature: GeoJSON.Feature, info?: OutlineInfo) => {
	const centre = globeCentre(feature);
	const [longitude, latitude] = centre;
	const projection = geoAzimuthalEqualArea()
		.rotate([-longitude, -latitude])
		.fitSize([FIT_SIZE, FIT_SIZE], feature);
	const [[left, top], [right, bottom]] = geoPath(projection).bounds(feature);
	// Shift so the shape's own top-left is the origin, giving a tight viewBox that starts at 0 0.
	const [shiftX, shiftY] = projection.translate();
	const width = right - left;
	const height = bottom - top;
	const outline = geoPath(projection.translate([shiftX - left, shiftY - top])).digits(2)(feature);
	const size = (value: number) => Number(value.toFixed(2));
	const markup = info ? infoMarkup({ info, centre }) : '';
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size(width)} ${size(height)}" width="${size(width)}" height="${size(height)}">${markup}<path d="${outline ?? ''}"/></svg>`;
};

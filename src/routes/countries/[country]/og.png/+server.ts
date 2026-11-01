import { error } from '@sveltejs/kit';
import { countryVariants, listAllCountries, loadCountry } from '#lib/server/countryData.ts';
import { mapToSvg, OG_HEIGHT, OG_WIDTH } from '#lib/server/mapSvg.ts';
import { svgToIndexedPng } from '#lib/server/ogImage.ts';
import type { EntryGenerator, RequestHandler } from './$types';

const OG_SIZE = { width: OG_WIDTH, height: OG_HEIGHT };

// Rendered once at build time and written out as a static file, like the pages themselves.
export const entries: EntryGenerator = async () =>
	(await listAllCountries()).map(({ code }) => ({ country: code }));

/** The country's default point of view, framed for the social preview's 1200×630 shape. */
export const GET: RequestHandler = async ({ params }) => {
	const [shown] = await countryVariants(params.country);
	const details = shown && (await loadCountry(shown.pov.slug, params.country, OG_SIZE));
	if (!details) error(404, 'Unknown country');
	const png = await svgToIndexedPng(mapToSvg(details.map, OG_SIZE));
	return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};

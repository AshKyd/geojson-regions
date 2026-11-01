import { error } from '@sveltejs/kit';
import { countryVariants, listAllCountries } from '#lib/server/countryData.ts';
import { outlineSvgResponse } from '#lib/server/outlineSvgResponse.ts';
import type { EntryGenerator, RequestHandler } from './$types';

// Prerendered with the country page: the outline of its default point of view.
export const entries: EntryGenerator = async () =>
	(await listAllCountries()).map(({ code }) => ({ country: code }));

export const GET: RequestHandler = async ({ params }) => {
	const [shown] = await countryVariants(params.country);
	if (!shown) error(404, 'Unknown country');
	return outlineSvgResponse({ pov: shown.pov.slug, code: params.country });
};

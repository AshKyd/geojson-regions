import { error } from '@sveltejs/kit';
import {
	countryVariants,
	listAllCountries,
	loadCountry,
	outlinesUrlPath
} from '#lib/server/countryData.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = async () =>
	(await listAllCountries()).map(({ code }) => ({ country: code }));

export const load: PageServerLoad = async ({ params }) => {
	const country = (await listAllCountries()).find(({ code }) => code === params.country);
	if (!country) error(404, 'Unknown country');
	const variants = await countryVariants(country.code);
	// Every listed country is in Natural Earth, whose de facto shape is the country's own page.
	const [shown] = variants;
	if (!shown) error(404, 'Unknown country');
	const details = await loadCountry(shown.pov.slug, country.code);
	if (!details) error(404, 'Unknown country');
	return {
		country,
		shownPov: shown.pov,
		outlinesPath: outlinesUrlPath(shown.pov.slug),
		map: details.map,
		excerpt: details.excerpt,
		/** Every point of view with its own shape, the same list the point-of-view pages show. */
		variants
	};
};

import { error } from '@sveltejs/kit';
import {
	isPublished,
	listPovs,
	loadCountry,
	outlinesUrlPath
} from '#lib/server/countryData.ts';
import { isDefaultView, povPageEntries } from '#lib/server/povEntries.ts';
import type { EntryGenerator, PageServerLoad } from './$types';

export const entries: EntryGenerator = povPageEntries;

export const load: PageServerLoad = async ({ params }) => {
	const pov = (await listPovs()).find(({ slug }) => slug === params.pov);
	const details = pov && (await loadCountry(pov.slug, params.country));
	// A shape identical to Natural Earth's has no page of its own.
	if (
		!pov ||
		!details ||
		!(await isPublished(pov.slug, params.country)) ||
		(await isDefaultView({ pov: pov.slug, country: params.country }))
	)
		error(404, 'Unknown country');
	// Named as the list names it, which covers every country sharing this view.
	const named = details.povs.find(({ slug }) => slug === pov.slug) ?? pov;
	return { pov: named, outlinesPath: outlinesUrlPath(pov.slug), ...details };
};

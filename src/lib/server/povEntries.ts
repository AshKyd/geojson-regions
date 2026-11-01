import { countryVariants, isPublished, listCountries, listPovs } from '#lib/server/countryData.ts';

/**
 * Whether a country's default point of view is this one. The default (usually Natural Earth's, or
 * the country's own view when it differs) lives on the country page (`/countries/CHN`), not on a
 * point-of-view page.
 */
export const isDefaultView = async ({ pov, country }: { pov: string; country: string }) =>
	(await countryVariants(country))[0]?.pov.slug === pov;

/** Every `{ country, pov }` that has its own point-of-view page: published, and not the country's default. */
export const povPageEntries = async () =>
	(
		await Promise.all(
			(await listPovs()).map(async ({ slug }) => {
				const countries = await listCountries(slug);
				const published = await Promise.all(countries.map(({ code }) => isPublished(slug, code)));
				const candidates = countries
					.filter((_, position) => published[position])
					.map(({ code }) => ({ country: code, pov: slug }));
				const isDefault = await Promise.all(candidates.map(isDefaultView));
				return candidates.filter((_, position) => !isDefault[position]);
			})
		)
	).flat();

import { error } from '@sveltejs/kit';
import { countryVariants, listAllCountries, listPovs } from '#lib/server/countryData.ts';
import { countriesDirectory, outlinesDirectory, readJson } from '#lib/server/outlineFiles.ts';
import { NATURAL_EARTH_SLUG, SITE_URL } from '#lib/constants.ts';
import { featureToSvg } from '#lib/utils/outlineSvg.ts';

/**
 * A country's outline in one point of view as an SVG response. The site is prerendered, so no
 * header set here survives; Caddy adds the `Content-Disposition` (see docker/Caddyfile).
 */
export const outlineSvgResponse = async ({ pov, code }: { pov: string; code: string }) => {
	const [feature, country, variants, povs] = await Promise.all([
		readJson<GeoJSON.Feature>(
			`${countriesDirectory}/${outlinesDirectory(pov)}/${code}.geojson`
		).catch(() => undefined),
		listAllCountries().then((countries) => countries.find((candidate) => candidate.code === code)),
		countryVariants(code),
		listPovs()
	]);
	// The variants carry the shared-view names; fall back to the plain list for a view they merged away.
	const named =
		variants.find(({ pov: candidate }) => candidate.slug === pov)?.pov ??
		povs.find(({ slug }) => slug === pov);
	if (!feature || !country || !named) error(404, 'Unknown country');
	const isDeFacto = pov === NATURAL_EARTH_SLUG;
	const isDefaultView = variants[0]?.pov.slug === pov;
	const pageUrl = `${SITE_URL}/countries/${code}${isDefaultView ? '' : `/${pov}`}`;
	const svg = featureToSvg(feature, {
		countryName: country.name,
		countryCode: code,
		povName: named.name,
		povSlug: pov,
		isDeFacto,
		sharedWith: named.sharedWith,
		pageUrl
	});
	return new Response(svg, { headers: { 'content-type': 'image/svg+xml; charset=utf-8' } });
};

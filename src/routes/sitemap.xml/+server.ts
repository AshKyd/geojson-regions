import { SitemapStream, streamToPromise } from 'sitemap';
import { SITE_URL } from '#lib/constants.ts';
import { listAllCountries } from '#lib/server/countryData.ts';
import { povPageEntries } from '#lib/server/povEntries.ts';
import type { RequestHandler } from './$types';

/** Every page on the site, written once at build time. */
export const GET: RequestHandler = async () => {
	const [countries, povPages] = await Promise.all([listAllCountries(), povPageEntries()]);
	const paths = [
		'/',
		'/countries',
		...countries.map(({ code }) => `/countries/${code}`),
		...povPages.map(({ country, pov }) => `/countries/${country}/${pov}`)
	];
	const sitemap = new SitemapStream({ hostname: SITE_URL });
	paths.forEach((url) => sitemap.write({ url }));
	sitemap.end();
	const xml = await streamToPromise(sitemap);
	return new Response(new Uint8Array(xml), {
		headers: { 'content-type': 'application/xml; charset=utf-8' }
	});
};

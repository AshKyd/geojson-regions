import { listAllCountries } from '#lib/server/countryData.ts';
import { isIsoAlpha3 } from '#lib/utils/isoCodes.ts';
import type { PageServerLoad } from './$types';

// Named disputed areas (Kosovo, Baikonur…) have no ISO code, so they're reachable but not listed.
export const load: PageServerLoad = async () => ({
	countries: (await listAllCountries()).filter(({ code }) => isIsoAlpha3(code))
});

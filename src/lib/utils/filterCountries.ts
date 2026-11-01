/** Strips accents and case, so "aland" finds "Åland". */
const simplify = (text: string) =>
	text
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLocaleLowerCase('en-AU');

/** Countries whose name contains the query; everything when the query is blank. */
export const filterCountries = <Country extends { name: string }>(
	countries: Country[],
	query: string
) => {
	const wanted = simplify(query.trim());
	if (!wanted) return countries;
	return countries.filter(({ name }) => simplify(name).includes(wanted));
};

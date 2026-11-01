/** Groups items under the first letter of their name (accents ignored), letters in order. */
export const groupByInitial = <Item extends { name: string }>(items: Item[]) => {
	const initialOf = ({ name }: Item) => name.normalize('NFD').charAt(0).toLocaleUpperCase('en-AU');
	return [...Map.groupBy(items, initialOf)]
		.sort(([a], [b]) => a.localeCompare(b, 'en-AU'))
		.map(([initial, group]) => ({ initial, items: group }));
};

import { createHash } from 'node:crypto';
import { geoBounds, geoCentroid } from 'd3-geo';
import { NATURAL_EARTH_SLUG } from '#lib/constants.ts';
import wikipediaExcerpts from '#lib/data/wikipedia-excerpts.json';
import { buildMapPaths } from '#lib/server/mapPaths.ts';
import {
	countriesDirectory,
	outlinesDirectory,
	readJson,
	readText
} from '#lib/server/outlineFiles.ts';
import type { GeoBox } from '#lib/utils/geoBoxes.ts';
import {
	framingProjection,
	globeCentre,
	isBoxInView,
	neighbourResolution
} from '#lib/utils/shapeFraming.ts';

export interface Pov {
	/** URL slug: Natural Earth's own `natural-earth`, or a point-of-view code like `arg`. */
	slug: string;
	name: string;
	/** Every country's name, when several countries share this view and `name` is shortened. */
	sharedWith?: string[];
}

/** A country's opening paragraph from English Wikipedia, with the revision it was taken from. */
export interface WikipediaExcerpt {
	/** Article title, as in its URL. */
	title: string;
	/** Revision id of the article the text was taken from, for a permanent link and attribution. */
	revision: number;
	excerpt: string;
}

export interface CountryListing {
	/** Filename without `.geojson`; also the URL segment. */
	code: string;
	name: string;
	continent: string;
}

/** Public URL path of a point of view's outlines, e.g. `/countries/pov/arg/10m`. */
export const outlinesUrlPath = (pov: string) => `/countries/${outlinesDirectory(pov)}`;

export const listPovs = async (): Promise<Pov[]> => {
	const povs = await readJson<Record<string, string>>(`${countriesDirectory}/povs.json`);
	return [
		{ slug: NATURAL_EARTH_SLUG, name: 'Natural Earth (de facto borders)' },
		...Object.entries(povs).map(([slug, name]) => ({ slug, name }))
	];
};

interface CountryIndex {
	all: Record<string, { filename: string; countryName: string | null }>;
	[continent: string]: Record<string, unknown>;
}

const listingCache = new Map<string, Promise<CountryListing[]>>();

export const listCountries = (pov: string) => {
	const cached = listingCache.get(pov);
	if (cached) return cached;
	const listing = readJson<CountryIndex>(
		`${countriesDirectory}/${outlinesDirectory(pov)}/index.json`
	).then((index) => {
		const continentByFilename = new Map(
			Object.entries(index).flatMap(([continent, countries]) =>
				continent === 'all'
					? []
					: Object.values(countries).map((filename) => [String(filename), continent] as const)
			)
		);
		return Object.entries(index.all)
			.map(([code, { filename, countryName }]) => ({
				code,
				// A few unnamed polygons in the Russia and Palestine point-of-view sets have no name at all.
				name: countryName || `Unnamed area (${code})`,
				continent: continentByFilename.get(filename) ?? ''
			}))
			.sort((a, b) => a.name.localeCompare(b.name));
	});
	listingCache.set(pov, listing);
	return listing;
};

interface ShapeSummary {
	code: string;
	box: GeoBox;
	/** [longitude, latitude] of the shape's centre. */
	centre: [number, number];
	/** Fingerprint of the geometry alone, so shapes can be compared across points of view. */
	hash: string;
}

const summaryByHash = new Map<string, Omit<ShapeSummary, 'hash' | 'code'>>();
const summaryCache = new Map<string, Promise<ShapeSummary>>();

/**
 * Fingerprints a shape and measures its box and centre. The geometry is the last key in each file,
 * so hashing the text from there on avoids parsing. Most shapes repeat across points of view, so
 * the (slower) parse only happens the first time a given geometry is seen.
 */
export const describeShape = (pov: string, code: string) => {
	const key = `${pov}/${code}`;
	const cached = summaryCache.get(key);
	if (cached) return cached;
	const summary = readText(`${countriesDirectory}/${outlinesDirectory(pov)}/${code}.geojson`).then(
		(text) => {
			const geometryText = text.slice(text.indexOf('"geometry"'));
			const hash = createHash('sha1').update(geometryText).digest('hex');
			const seen = summaryByHash.get(hash);
			if (seen) return { code, hash, ...seen };
			const feature = JSON.parse(text) as GeoJSON.Feature;
			const measured = {
				box: geoBounds(feature) as GeoBox,
				centre: geoCentroid(feature) as [number, number]
			};
			summaryByHash.set(hash, measured);
			return { code, hash, ...measured };
		}
	);
	summaryCache.set(key, summary);
	return summary;
};

/** Whether Natural Earth's own (de facto) borders include this country. */
const isInNaturalEarth = async (code: string) =>
	(await listCountries(NATURAL_EARTH_SLUG)).some((country) => country.code === code);

/** Whether a country's shape in this point of view matches Natural Earth's own, byte for byte. */
export const isSameAsNaturalEarth = async (pov: string, code: string) => {
	if (pov === NATURAL_EARTH_SLUG) return true;
	if (!(await isInNaturalEarth(code))) return false;
	const [mine, theirs] = await Promise.all([
		describeShape(pov, code),
		describeShape(NATURAL_EARTH_SLUG, code)
	]);
	return mine.hash === theirs.hash;
};

/**
 * Whether a country gets its own page in a point of view. Only countries in Natural Earth's de facto
 * borders are listed: points of view add odd extras (unnamed polygons, areas that only exist in one
 * claim). A shape identical to Natural Earth's has nothing to add, so only Natural Earth's page
 * exists for it and the point-of-view page 404s.
 */
export const isPublished = async (pov: string, code: string) =>
	pov === NATURAL_EARTH_SLUG ||
	((await isInNaturalEarth(code)) &&
		(await countryVariants(code)).some((variant) => variant.pov.slug === pov));

/** Whether a point of view draws this country differently from Natural Earth; the first cut of what's published. */
const differsFromNaturalEarth = async (pov: string, code: string) =>
	pov === NATURAL_EARTH_SLUG ||
	((await isInNaturalEarth(code)) && !(await isSameAsNaturalEarth(pov, code)));

export interface AllCountriesListing extends CountryListing {
	/** Slugs of the points of view this country has a shape in; Natural Earth's comes first. */
	povs: string[];
}

/** Every country across all points of view, one row each, named as Natural Earth names it where possible. */
export const listAllCountries = async (): Promise<AllCountriesListing[]> => {
	const povs = await listPovs();
	const byCode = new Map<string, AllCountriesListing>();
	const perPov = await Promise.all(
		povs.map(async ({ slug }) => [slug, await listCountries(slug)] as const)
	);
	// Only shapes that get their own page; ones identical to Natural Earth's are folded into its entry.
	const published = await Promise.all(
		perPov.map(async ([slug, countries]) => ({
			slug,
			countries: (
				await Promise.all(
					countries.map(async (country) =>
						(await isPublished(slug, country.code)) ? country : undefined
					)
				)
			).filter((country): country is CountryListing => Boolean(country))
		}))
	);
	published.forEach(({ slug, countries }) =>
		countries.forEach((country) => {
			const existing = byCode.get(country.code);
			if (existing) existing.povs.push(slug);
			else byCode.set(country.code, { ...country, povs: [slug] });
		})
	);
	return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));
};

export interface CountryVariant {
	pov: Pov;
	/** Fingerprint of this point of view's shape; equal hashes mean the same outline. */
	hash: string;
	sameAsNaturalEarth: boolean;
}

/** The generic ISO set, which belongs to no country. */
const ISO_POV_SLUG = 'iso';

const variantsCache = new Map<string, Promise<CountryVariant[]>>();

/**
 * The shape of one country in every point of view that publishes it, Natural Earth's first.
 * Worked out once per country and shared by all of that country's pages, so each lists the same set.
 */
export const countryVariants = (code: string) => {
	const cached = variantsCache.get(code);
	if (cached) return cached;
	const variants = findCountryVariants(code);
	variantsCache.set(code, variants);
	return variants;
};

/** Names shown in full in a list entry before the rest are counted, e.g. "Argentina, Brazil, France & 15 more". */
const NAMES_SHOWN = 3;

/** Short label for a merged entry: up to three names in full, otherwise the first three and a count. */
const shortSharedName = (names: string[]) => {
	if (names.length <= NAMES_SHOWN)
		return [names.slice(0, -1).join(', '), names.at(-1)].filter(Boolean).join(' & ');
	return `${names.slice(0, NAMES_SHOWN).join(', ')} & ${names.length - NAMES_SHOWN} more`;
};

/**
 * Many countries draw another country the same way (a dozen share one view of China), so those
 * collapse into one entry. It's labelled with the first few, and keeps every name in `sharedWith`
 * for the page to list in full. The first keeps its slug, and so its page.
 */
const mergeSameShapes = (variants: CountryVariant[]): CountryVariant[] => {
	const byHash = Map.groupBy(variants, ({ hash }) => hash);
	return [...byHash.values()].flatMap((group) => {
		const [first] = group;
		if (!first) return [];
		const names = group.map(({ pov }) => pov.name);
		return [
			{
				...first,
				pov: { slug: first.pov.slug, name: shortSharedName(names), sharedWith: names }
			}
		];
	});
};

const findCountryVariants = async (code: string): Promise<CountryVariant[]> => {
	// ISO isn't a country's view, just a generic set, so it isn't offered as a point of view.
	const povs = (await listPovs()).filter(({ slug }) => slug !== ISO_POV_SLUG);
	const present = await Promise.all(
		povs.map(async (pov) =>
			(await listCountries(pov.slug)).some((country) => country.code === code) &&
			(await differsFromNaturalEarth(pov.slug, code))
				? pov
				: undefined
		)
	);
	const variants: CountryVariant[] = await Promise.all(
		present
			.filter((pov): pov is Pov => Boolean(pov))
			.map(async (pov) => ({
				pov,
				hash: (await describeShape(pov.slug, code)).hash,
				sameAsNaturalEarth: await isSameAsNaturalEarth(pov.slug, code)
			}))
	);

	// Natural Earth's de facto borders lead and are the default shown on the country page. Views
	// identical to it are already gone; those that agree with each other collapse into one entry.
	const naturalEarth = variants.filter(({ pov }) => pov.slug === NATURAL_EARTH_SLUG);
	const others = variants.filter(({ pov }) => pov.slug !== NATURAL_EARTH_SLUG);
	return [...naturalEarth, ...mergeSameShapes(others)];
};

/**
 * One country in one point of view, with its map projected for drawing. `size` frames the map for
 * something other than the page, such as the social image.
 */
export const loadCountry = async (
	pov: string,
	code: string,
	size?: { width: number; height: number; padding?: number }
) => {
	const countries = await listCountries(pov);
	const country = countries.find((candidate) => candidate.code === code);
	if (!country) return undefined;
	const naturalEarthCodes = new Set(
		(await listCountries(NATURAL_EARTH_SLUG)).map((candidate) => candidate.code)
	);
	// Neighbours are limited to Natural Earth's countries too, so the unnamed extras that points of
	// view add never show up on the map.
	const neighbourPool = countries.filter((candidate) => naturalEarthCodes.has(candidate.code));
	const [targetFeature, candidates, sameAsNaturalEarth] = await Promise.all([
		readJson<GeoJSON.Feature>(`${countriesDirectory}/${outlinesDirectory(pov)}/${code}.geojson`),
		Promise.all(neighbourPool.map(({ code: other }) => describeShape(pov, other))),
		isSameAsNaturalEarth(pov, code)
	]);
	// Every shape that reaches into the map's frame is drawn, so the only gaps left are open water.
	const project = framingProjection(targetFeature, size);
	const neighbourCodes = new Set(
		candidates
			.filter(
				(candidate) =>
					candidate.code !== code && isBoxInView({ box: candidate.box, project, ...size })
			)
			.map((candidate) => candidate.code)
	);
	const neighbours = neighbourPool.filter((candidate) => neighbourCodes.has(candidate.code));
	const [variants, map] = await Promise.all([
		countryVariants(code),
		buildMapPaths({
			pov,
			targetFeature,
			projection: project,
			centre: globeCentre(targetFeature),
			neighbours,
			resolution: neighbourResolution(project)
		})
	]);
	return {
		/** Every point of view with its own shape of this country; the same list on each of its pages. */
		povs: variants.map(({ pov: published }) => published),
		country,
		sameAsNaturalEarth,
		/** The map, projected and thinned for drawing. */
		map,
		excerpt: (wikipediaExcerpts as Record<string, WikipediaExcerpt | undefined>)[code]
	};
};

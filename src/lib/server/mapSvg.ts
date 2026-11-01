import type { MapPaths } from '#lib/utils/mapTypes.ts';

/** Size of the social preview image, the shape every major network crops to. */
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

/** Escapes text for use inside an XML attribute. */
const escapeAttribute = (text: string) =>
	text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/**
 * A standalone SVG of the map for rasterising into the social preview. The page styles its map with
 * CSS variables and classes, which a rasteriser doesn't have, so the colours are written inline
 * here: a flat deep purple behind (the same as the build button), a faint globe, hairline neighbours
 * and the country in the site's pink-to-yellow gradient with a white border. There is no text, so no fonts are needed.
 */
export const mapToSvg = (map: MapPaths, { width = OG_WIDTH, height = OG_HEIGHT } = {}) => {
	const maskId = 'outside-country';
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<defs>
<linearGradient id="country-fill" x1="0" y1="0" x2="1" y2="1">
<stop offset="0.3" stop-color="#ff1361"/>
<stop offset="1" stop-color="#fff800"/>
</linearGradient>
<mask id="${maskId}" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
<rect width="${width}" height="${height}" fill="white"/>
<path d="${escapeAttribute(map.target)}" fill="black"/>
</mask>
</defs>
<rect width="${width}" height="${height}" fill="#190831"/>
<path d="${escapeAttribute(map.globe)}" fill="#ffffff" fill-opacity="0.04" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1"/>
<g mask="url(#${maskId})" stroke="#ffffff" stroke-linejoin="round">
${map.neighbours
	.map(
		({ d }) =>
			`<path d="${escapeAttribute(d)}" fill="#ffffff" fill-opacity="0.08" stroke-width="0.5"/>`
	)
	.join('\n')}
<path d="${escapeAttribute(map.target)}" fill="none" stroke-width="4"/>
</g>
<path d="${escapeAttribute(map.target)}" fill="url(#country-fill)"/>
</svg>`;
};

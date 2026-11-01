import sharp from 'sharp';
import { pngPaletteSize } from '#lib/server/pngPaletteSize.ts';

/** Most colours an OG image may use. */
const MAX_PALETTE_COLOURS = 32;

/**
 * Sharp's `colours` option isn't honoured at its default quality (the palette stays at 256), but
 * the quantiser does thin the palette as `quality` drops. So step the quality down until the
 * palette fits, which keeps the file as close to full quality as the limit allows.
 */
const QUALITIES_TO_TRY = [70, 65, 60, 55, 50, 40, 30, 20, 10];

/**
 * Rasterises an SVG into a small 8-bit (indexed) PNG of at most 32 colours. Indexed PNGs are far
 * smaller than the 32-bit ones a plain rasteriser writes, which matters across ~250 images.
 * Dithering stops the country's gradient fill from banding at so few colours.
 */
export const svgToIndexedPng = async (svg: string) => {
	// Drawn once at full colour: the SVG (hundreds of KB of paths) is by far the slowest part, and
	// the quality ladder below may take several tries at quantising the same pixels.
	const { data, info } = await sharp(Buffer.from(svg))
		.ensureAlpha()
		.raw()
		.toBuffer({ resolveWithObject: true });
	const { width, height, channels } = info;
	const quantise = (quality: number) =>
		sharp(data, { raw: { width, height, channels } })
			.png({
				palette: true,
				colours: MAX_PALETTE_COLOURS,
				quality,
				dither: 1,
				effort: 10,
				compressionLevel: 9
			})
			.toBuffer();

	// Tried one after another, since each result decides whether the next is needed.
	for (const quality of QUALITIES_TO_TRY) {
		const png = await quantise(quality);
		if (pngPaletteSize(png) <= MAX_PALETTE_COLOURS) return png;
	}
	throw new Error(`Couldn't fit the image in ${MAX_PALETTE_COLOURS} colours`);
};

/** Length of the 8-byte PNG signature, after which the chunks start. */
const PNG_SIGNATURE_LENGTH = 8;
/** Each chunk is a 4-byte length, a 4-byte type, its data and a 4-byte checksum. */
const CHUNK_OVERHEAD = 12;

/** How many colours an indexed PNG's palette holds; 0 if it has none (a 24 or 32-bit PNG). */
export const pngPaletteSize = (png: Uint8Array) => {
	const view = new DataView(png.buffer, png.byteOffset, png.byteLength);
	for (let offset = PNG_SIGNATURE_LENGTH; offset + CHUNK_OVERHEAD <= png.length;) {
		const length = view.getUint32(offset);
		const type = String.fromCharCode(...png.slice(offset + 4, offset + 8));
		if (type === 'PLTE') return length / 3;
		offset += CHUNK_OVERHEAD + length;
	}
	return 0;
};

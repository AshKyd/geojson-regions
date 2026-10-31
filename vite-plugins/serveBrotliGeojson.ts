import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, normalize } from 'node:path';
import type { Connect, Plugin } from 'vite';

/**
 * Only `.geojson.br` files are committed. This answers requests for `x.geojson` from the
 * `.br` beside it, marked `Content-Encoding: br` so the browser decompresses it transparently.
 * Production does the same in `docker/Caddyfile`.
 */
const brotliGeojsonMiddleware = (directory: string): Connect.NextHandleFunction => {
	return async (request, response, next) => {
		const [pathname = ''] = (request.url ?? '').split('?');
		if (!pathname.endsWith('.geojson')) return next();

		// normalize() collapses any `..` so a request can't climb out of the directory.
		const compressedPath = join(directory, normalize(decodeURIComponent(pathname))) + '.br';
		if (!compressedPath.startsWith(directory)) return next();
		const compressed = await stat(compressedPath).catch(() => undefined);
		if (!compressed?.isFile()) return next();

		response.setHeader('Content-Type', 'application/json');
		response.setHeader('Content-Encoding', 'br');
		response.setHeader('Content-Length', compressed.size);
		response.setHeader('Vary', 'Accept-Encoding');
		createReadStream(compressedPath).pipe(response);
	};
};

/** `dev` serves `static/`; `preview` serves the `build/` output. */
export const serveBrotliGeojson = ({
	devDirectory = 'static',
	previewDirectory = 'build'
}: { devDirectory?: string; previewDirectory?: string } = {}): Plugin => ({
	name: 'serve-brotli-geojson',
	configureServer: (server) => {
		server.middlewares.use(brotliGeojsonMiddleware(join(process.cwd(), devDirectory)));
	},
	configurePreviewServer: (server) => {
		server.middlewares.use(brotliGeojsonMiddleware(join(process.cwd(), previewDirectory)));
	}
});

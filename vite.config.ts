import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { serveBrotliGeojson } from './vite-plugins/serveBrotliGeojson.ts';

export default defineConfig({
	// Rolldown's "PLUGIN_TIMINGS" advice is noise for a build this small.
	build: { rolldownOptions: { checks: { pluginTimings: false } } },
	test: { include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'] },
	plugins: [
		serveBrotliGeojson(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Fully prerendered; Caddy serves the output, including the pre-compressed .br files.
			adapter: adapter({ fallback: '404.html' })
		})
	]
});

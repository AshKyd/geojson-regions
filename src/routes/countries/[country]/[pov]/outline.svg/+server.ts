import { outlineSvgResponse } from '#lib/server/outlineSvgResponse.ts';
import { povPageEntries } from '#lib/server/povEntries.ts';
import type { EntryGenerator, RequestHandler } from './$types';

// The same countries and points of view that have a page of their own.
export const entries: EntryGenerator = povPageEntries;

export const GET: RequestHandler = ({ params }) =>
	outlineSvgResponse({ pov: params.pov, code: params.country });

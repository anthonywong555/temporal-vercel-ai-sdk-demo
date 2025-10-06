import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = ({ params }) => {
	if (params.slug) {
		// TODO: Check against the DB.
		return {id: params.slug}
	}

	error(404, 'Not found');
};
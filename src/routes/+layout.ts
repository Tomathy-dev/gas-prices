export const ssr = false;

import type { LayoutLoad } from './$types';
import type { FuelType, Brand, District, Municipality } from '$lib/api/types';

const DGEG = 'https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb';

async function fetchJSON<T>(fetch: typeof globalThis.fetch, endpoint: string): Promise<T> {
	const res = await fetch(`${DGEG}/${endpoint}`);
	const data = await res.json();
	return data.resultado as T;
}

export const load: LayoutLoad = async ({ fetch }) => {
	const [fuelTypes, brands, districts, municipalities] = await Promise.all([
		fetchJSON<FuelType[]>(fetch, 'GetTiposCombustiveis?fl_viewWebSite=true&fl_ativo=true'),
		fetchJSON<Brand[]>(fetch, 'GetMarcas'),
		fetchJSON<District[]>(fetch, 'GetDistritos'),
		fetchJSON<Municipality[]>(fetch, 'GetMunicipios'),
	]);

	return { fuelTypes, brands, districts, municipalities };
};

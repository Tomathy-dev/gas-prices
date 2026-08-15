import type { DGEGResponse, FuelType, Brand, District, Municipality, StationType, Station, StationDetail, StationSearchParams } from './types';

const BASE = 'https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb';

async function get<T>(endpoint: string, params: Record<string, string | number | boolean | null | undefined> = {}): Promise<T> {
	const url = new URL(`${BASE}/${endpoint}`);
	for (const [key, val] of Object.entries(params)) {
		if (val !== null && val !== undefined && val !== '') {
			url.searchParams.set(key, String(val));
		}
	}
	const res = await fetch(url.toString());
	if (!res.ok) throw new Error(`API error ${res.status}: ${res.statusText}`);
	const data: DGEGResponse<T> = await res.json();
	if (!data.status) throw new Error(data.mensagem || 'API returned error');
	return data.resultado;
}

export const dgeg = {
	getFuelTypes: (): Promise<FuelType[]> =>
		get('GetTiposCombustiveis', { fl_viewWebSite: true, fl_ativo: true }),

	getBrands: (): Promise<Brand[]> => get('GetMarcas'),

	getDistricts: (): Promise<District[]> => get('GetDistritos'),

	getMunicipalities: (): Promise<Municipality[]> => get('GetMunicipios'),

	getStationTypes: (): Promise<StationType[]> => get('GetTiposPostos'),

	searchStations: (params: StationSearchParams): Promise<Station[]> =>
		get('PesquisarPostos', {
			...params,
			qtdPorPagina: params.qtdPorPagina ?? 9999,
			pagina: params.pagina ?? 1,
		}),

	getStationDetail: (id: number): Promise<StationDetail> =>
		get('GetDadosPosto', { id }),
};

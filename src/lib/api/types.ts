export interface FuelType {
	Id: number;
	Descritivo: string;
	UnidadeMedida: string;
	fl_ViewWebSite: boolean;
	fl_rodoviario: boolean;
	fl_ativo: boolean;
}

export interface Brand {
	Id: number;
	Descritivo: string;
}

export interface District {
	Id: number;
	Descritivo: string;
}

export interface Municipality {
	Id: number;
	IdDistrito: number;
	Descritivo: string;
	Distrito: { Id: number; Descritivo: string };
}

export interface StationType {
	Id: number;
	Descritivo: string;
}

export interface Station {
	Id: number;
	Nome: string;
	TipoPosto: string | null;
	Municipio: string | null;
	Preco: string | null;
	Marca: string | null;
	Combustivel: string | null;
	DataAtualizacao: string | null;
	Distrito: string | null;
	Morada: string | null;
	Localidade: string | null;
	CodPostal: string | null;
	Latitude: number;
	Longitude: number;
	Quantidade: number;
}

export interface FuelPrice {
	TipoCombustivel: string;
	Preco: string;
	DataAtualizacao: string;
}

export interface StationDetail {
	Nome: string;
	Marca: string;
	Utilizacao: string;
	TipoPosto: string;
	Morada: {
		Distrito: string;
		Municipio: string;
		Morada: string;
		Localidade: string;
		CodPostal: string;
		Latitude: number;
		Longitude: number;
		Sentido: string | null;
	};
	HorarioPosto: {
		DiasUteis: string;
		Sabado: string;
		Domingo: string;
		Feriado: string;
	} | null;
	Servicos: Array<{ Descritivo: string; FicheiroLogo: string }>;
	MeiosPagamento: Array<{ Descritivo: string; FicheiroLogo: string }>;
	Combustiveis: FuelPrice[];
	OutrosServicos: string | null;
	Observacoes: string | null;
}

export interface DGEGResponse<T> {
	status: boolean;
	mensagem: string;
	resultado: T;
	token: string | null;
}

export type SortBy = 'price_asc' | 'price_desc' | 'distance_asc' | 'name_asc';

export interface StationSearchParams {
	idsTiposComb?: number | string;
	idMarca?: number | null;
	idTipoPosto?: number | null;
	idDistrito?: number | null;
	idsMunicipios?: string;
	qtdPorPagina?: number;
	pagina?: number;
	orderDesc?: boolean | null;
}

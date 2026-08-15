import type { SortBy } from '$lib/api/types';

export const DEFAULT_FUEL_TYPE_ID = 3201; // Gasolina simples 95

let fuelTypeId = $state(DEFAULT_FUEL_TYPE_ID);
let brandId = $state<number | null>(null);
let districtId = $state<number | null>(null);
let municipalityIds = $state<number[]>([]);
let stationTypeId = $state<number | null>(null);
let nearMe = $state(false);
let radiusKm = $state(10);
let sortBy = $state<SortBy>('price_asc');

export const filters = {
	get fuelTypeId() { return fuelTypeId; },
	set fuelTypeId(v: number) { fuelTypeId = v; },

	get brandId() { return brandId; },
	set brandId(v: number | null) { brandId = v; },

	get districtId() { return districtId; },
	set districtId(v: number | null) {
		districtId = v;
		municipalityIds = []; // reset municipalities when district changes
	},

	get municipalityIds() { return municipalityIds; },
	set municipalityIds(v: number[]) { municipalityIds = v; },

	get stationTypeId() { return stationTypeId; },
	set stationTypeId(v: number | null) { stationTypeId = v; },

	get nearMe() { return nearMe; },
	set nearMe(v: boolean) { nearMe = v; },

	get radiusKm() { return radiusKm; },
	set radiusKm(v: number) { radiusKm = v; },

	get sortBy() { return sortBy; },
	set sortBy(v: SortBy) { sortBy = v; },

	reset() {
		brandId = null;
		districtId = null;
		municipalityIds = [];
		stationTypeId = null;
		nearMe = false;
		radiusKm = 10;
		sortBy = 'price_asc';
	}
};

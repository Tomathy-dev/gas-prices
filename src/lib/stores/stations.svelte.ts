import type { Station, StationDetail } from '$lib/api/types';

let all = $state<Station[]>([]);
let loading = $state(false);
let error = $state<string | null>(null);
let selectedDetail = $state<StationDetail | null>(null);
let selectedId = $state<number | null>(null);
let detailLoading = $state(false);

export const stationsStore = {
	get all() { return all; },
	get loading() { return loading; },
	get error() { return error; },
	get selectedDetail() { return selectedDetail; },
	get selectedId() { return selectedId; },
	get detailLoading() { return detailLoading; },

	setAll(v: Station[]) { all = v; },
	setLoading(v: boolean) { loading = v; },
	setError(v: string | null) { error = v; },
	setDetail(v: StationDetail | null) { selectedDetail = v; },
	setSelectedId(v: number | null) { selectedId = v; },
	setDetailLoading(v: boolean) { detailLoading = v; },

	clearSelection() {
		selectedDetail = null;
		selectedId = null;
	}
};

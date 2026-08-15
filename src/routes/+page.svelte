<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { Station } from '$lib/api/types';
	import { dgeg } from '$lib/api/dgeg';
	import { filters } from '$lib/stores/filters.svelte';
	import { stationsStore } from '$lib/stores/stations.svelte';
	import { userLocation } from '$lib/stores/location.svelte';
	import { parsePrice } from '$lib/utils/price';
	import { haversine } from '$lib/utils/geo';
	import FilterPanel from '$lib/components/FilterPanel.svelte';
	import StationList from '$lib/components/StationList.svelte';
	import StationMap from '$lib/components/StationMap.svelte';
	import StationDetailModal from '$lib/components/StationDetailModal.svelte';

	let { data }: { data: PageData } = $props();

	let activeTab = $state<'list' | 'map'>('map');
	let filterDrawerOpen = $state(false);
	let detailError = $state<string | null>(null);
	// Plain let (not $state) — bind:this writes directly; reactivity not needed here
	let mapComponent: { flyToStation: (lat: number, lon: number) => void; flyToPortugal: () => void } | null = null;

	// --- Data fetching ---

	async function fetchStations() {
		stationsStore.setLoading(true);
		stationsStore.setError(null);
		try {
			const results = await dgeg.searchStations({
				idsTiposComb: filters.fuelTypeId,
				idMarca: filters.brandId,
				idDistrito: !filters.nearMe ? filters.districtId : null,
				idsMunicipios:
					!filters.nearMe && filters.municipalityIds.length > 0
						? filters.municipalityIds.join(',')
						: undefined
			});
			stationsStore.setAll(results);
		} catch (e) {
			stationsStore.setError(e instanceof Error ? e.message : 'Erro ao carregar postos');
		} finally {
			stationsStore.setLoading(false);
		}
	}

	async function openStationDetail(id: number) {
		stationsStore.setSelectedId(id);

		// Zoom map to the station
		const station = displayedStations.find((s) => s.Id === id);
		if (station?.Latitude && station?.Longitude) {
			mapComponent?.flyToStation(station.Latitude, station.Longitude);
			// On mobile: switch to map tab so user can see the zoom
			if (activeTab === 'list') activeTab = 'map';
		}

		detailError = null;
		stationsStore.setDetailLoading(true);
		stationsStore.setDetail(null);
		try {
			const detail = await dgeg.getStationDetail(id);
			stationsStore.setDetail(detail);
		} catch (e) {
			detailError = e instanceof Error ? e.message : 'Erro ao carregar detalhes';
		} finally {
			stationsStore.setDetailLoading(false);
		}
	}

	function closeDetail() {
		stationsStore.clearSelection();
		detailError = null;
	}

	// --- Derived / filtered stations ---

	const displayedStations = $derived.by((): Station[] => {
		let list = stationsStore.all;

		if (filters.brandId !== null) {
			const brandName = data.brands.find((b) => b.Id === filters.brandId)?.Descritivo ?? '';
			list = list.filter((s) => s.Marca === brandName);
		}

		if (filters.nearMe && userLocation.lat !== null && userLocation.lon !== null) {
			const lat = userLocation.lat;
			const lon = userLocation.lon;
			const r = filters.radiusKm;
			list = list.filter((s) => {
				if (!s.Latitude || !s.Longitude) return false;
				return haversine(lat, lon, s.Latitude, s.Longitude) <= r;
			});
		}

		const uLat = userLocation.lat;
		const uLon = userLocation.lon;
		list = [...list].sort((a, b) => {
			switch (filters.sortBy) {
				case 'price_asc': {
					const pa = parsePrice(a.Preco) ?? Infinity;
					const pb = parsePrice(b.Preco) ?? Infinity;
					return pa - pb;
				}
				case 'price_desc': {
					const pa = parsePrice(a.Preco) ?? -Infinity;
					const pb = parsePrice(b.Preco) ?? -Infinity;
					return pb - pa;
				}
				case 'distance_asc': {
					if (uLat === null || uLon === null) return 0;
					const da =
						a.Latitude && a.Longitude ? haversine(uLat, uLon, a.Latitude, a.Longitude) : Infinity;
					const db =
						b.Latitude && b.Longitude ? haversine(uLat, uLon, b.Latitude, b.Longitude) : Infinity;
					return da - db;
				}
				case 'name_asc':
					return a.Nome.localeCompare(b.Nome);
				default:
					return 0;
			}
		});

		return list;
	});

	onMount(() => {
		fetchStations();
		(window as Window & { __selectStation?: (id: number) => void }).__selectStation =
			openStationDetail;
	});
</script>

<div class="flex flex-col h-dvh overflow-hidden bg-surface-950 text-white">
	<!-- ===== HEADER ===== -->
	<header class="flex-shrink-0 flex items-center justify-between px-3 sm:px-4 h-14 border-b border-white/8 bg-surface-950/95 backdrop-blur-sm z-30">
		<!-- Logo -->
		<div class="flex items-center gap-2.5">
			<div class="w-7 h-7 bg-amber-500 rounded flex items-center justify-center">
				<svg class="w-4 h-4 text-black" fill="currentColor" viewBox="0 0 24 24">
					<path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11A3 3 0 0114 9.5a3 3 0 01-3-3 3 3 0 00-3-3c-1.66 0-3 1.34-3 3s1.34 3 3 3c.48 0 .93-.13 1.33-.34L11.39 11A4.97 4.97 0 009 15.5V19h2v-3.5c0-1.66 1.34-3 3-3s3 1.34 3 3V19h2v-3.5a5 5 0 00-2.23-4.27zM8 6.5a1 1 0 110-2 1 1 0 010 2z"/>
				</svg>
			</div>
			<span class="font-bold text-lg tracking-tight text-white">GasPT</span>
		</div>

		<!-- Center: status -->
		<div class="hidden sm:flex items-center gap-2 text-sm text-surface-400">
			{#if stationsStore.loading}
				<span class="animate-pulse text-amber-400">A carregar...</span>
			{:else}
				<span class="text-surface-300 font-medium">{displayedStations.length}</span>
				<span>postos</span>
			{/if}
		</div>

		<!-- Right: map/list tabs (mobile) + filter toggle (mobile) -->
		<div class="flex items-center gap-1.5">
			<div class="flex sm:hidden items-center rounded-lg bg-surface-800 border border-white/10 p-0.5">
				<button
					onclick={() => (activeTab = 'map')}
					class={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'map' ? 'bg-amber-500 text-black font-semibold' : 'text-surface-400 hover:text-white'}`}
				>
					Mapa
				</button>
				<button
					onclick={() => (activeTab = 'list')}
					class={`px-3 py-1 text-xs rounded-md transition-all ${activeTab === 'list' ? 'bg-amber-500 text-black font-semibold' : 'text-surface-400 hover:text-white'}`}
				>
					Lista
				</button>
			</div>

			<!-- Filter button (mobile only) -->
			<button
				onclick={() => (filterDrawerOpen = !filterDrawerOpen)}
				class="sm:hidden relative p-2 rounded-lg border border-white/10 text-surface-400 hover:text-white hover:border-white/20 transition-all"
				aria-label="Filtros"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
				</svg>
				<!-- Active filter count badge -->
				{#if [filters.brandId, filters.districtId].filter(Boolean).length + (filters.nearMe ? 1 : 0) > 0}
					<span class="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black text-[9px] font-bold flex items-center justify-center">
						{[filters.brandId, filters.districtId].filter(Boolean).length + (filters.nearMe ? 1 : 0)}
					</span>
				{/if}
			</button>
		</div>
	</header>

	<!-- ===== BODY ===== -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Filter sidebar (desktop) -->
		<aside class="hidden sm:flex flex-col w-72 flex-shrink-0 overflow-hidden">
			<FilterPanel
				fuelTypes={data.fuelTypes}
				brands={data.brands}
				districts={data.districts}
				municipalities={data.municipalities}
				stationCount={displayedStations.length}
				onFuelTypeChange={fetchStations}
				onReload={fetchStations}
			/>
		</aside>

		<!-- Main content area -->
		<main class="flex flex-1 overflow-hidden">
			<!-- Desktop: list left, map right -->
			<div class="hidden sm:flex flex-col w-80 border-r border-white/8 overflow-hidden">
				<StationList
					stations={displayedStations}
					userLat={userLocation.lat}
					userLon={userLocation.lon}
					loading={stationsStore.loading}
					error={stationsStore.error}
					selectedStationId={stationsStore.selectedId}
					onSelectStation={openStationDetail}
				/>
			</div>

			<!-- Map -->
			<div class={`flex-1 overflow-hidden ${activeTab === 'list' ? 'hidden sm:block' : 'block'}`}>
				<StationMap
					bind:this={mapComponent}
					stations={displayedStations}
					userLat={userLocation.lat}
					userLon={userLocation.lon}
					radiusKm={filters.radiusKm}
					showRadius={filters.nearMe}
					selectedStationId={stationsStore.selectedId}
					onSelectStation={openStationDetail}
				/>
			</div>

			<!-- Mobile list view -->
			{#if activeTab === 'list'}
				<div class="sm:hidden flex-1 overflow-hidden">
					<StationList
						stations={displayedStations}
						userLat={userLocation.lat}
						userLon={userLocation.lon}
						loading={stationsStore.loading}
						error={stationsStore.error}
						selectedStationId={stationsStore.selectedId}
						onSelectStation={openStationDetail}
					/>
				</div>
			{/if}
		</main>
	</div>

	<!-- ===== MOBILE FILTER — BOTTOM SHEET ===== -->
	{#if filterDrawerOpen}
		<!-- Backdrop -->
		<div
			class="sm:hidden fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
			onclick={() => (filterDrawerOpen = false)}
			role="presentation"
		></div>

		<!-- Sheet slides up from bottom -->
		<div
			class="sm:hidden fixed inset-x-0 bottom-0 z-50 flex flex-col max-h-[88dvh] bg-surface-950 border-t border-white/12 rounded-t-2xl overflow-hidden shadow-2xl"
			role="dialog"
			aria-modal="true"
		>
			<!-- Drag handle -->
			<div class="flex-shrink-0 flex justify-center pt-3 pb-1">
				<div class="w-10 h-1 rounded-full bg-surface-600"></div>
			</div>

			<FilterPanel
				fuelTypes={data.fuelTypes}
				brands={data.brands}
				districts={data.districts}
				municipalities={data.municipalities}
				stationCount={displayedStations.length}
				onFuelTypeChange={() => { fetchStations(); filterDrawerOpen = false; }}
				onReload={() => { fetchStations(); filterDrawerOpen = false; }}
				onClose={() => (filterDrawerOpen = false)}
			/>
		</div>
	{/if}

	<!-- ===== STATION DETAIL MODAL ===== -->
	<StationDetailModal
		detail={stationsStore.selectedDetail}
		loading={stationsStore.detailLoading}
		error={detailError}
		onClose={closeDetail}
	/>
</div>

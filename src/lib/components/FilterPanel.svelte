<script lang="ts">
	import type { FuelType, Brand, District, Municipality } from '$lib/api/types';
	import { filters } from '$lib/stores/filters.svelte';
	import { userLocation } from '$lib/stores/location.svelte';

	interface Props {
		fuelTypes: FuelType[];
		brands: Brand[];
		districts: District[];
		municipalities: Municipality[];
		stationCount: number;
		onFuelTypeChange: () => void;
		onReload: () => void;
		onClose?: () => void;
	}

	let {
		fuelTypes,
		brands,
		districts,
		municipalities,
		stationCount,
		onFuelTypeChange,
		onReload,
		onClose
	}: Props = $props();

	const filteredMunicipalities = $derived(
		filters.districtId
			? municipalities.filter((m) => m.IdDistrito === filters.districtId)
			: []
	);

	const RADIUS_OPTIONS = [5, 10, 25, 50, 100];

	const activeFilterCount = $derived(
		[
			filters.brandId !== null,
			filters.districtId !== null,
			filters.stationTypeId !== null,
			filters.nearMe,
			filters.maxPrice !== null,
		].filter(Boolean).length
	);

	async function handleNearMeToggle() {
		if (filters.nearMe) {
			filters.nearMe = false;
			userLocation.clear();
		} else {
			const ok = await userLocation.request();
			if (ok) {
				filters.nearMe = true;
				filters.districtId = null;
				filters.municipalityIds = [];
			}
		}
	}

	function clearFilters() {
		filters.reset();
		userLocation.clear();
		onFuelTypeChange(); // refetch so district/municipality server-side filter is lifted
	}
</script>

<div class="flex flex-col h-full bg-surface-950 border-r border-white/8">
	<!-- Header -->
	<div class="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
		<div class="flex items-center gap-2">
			<svg class="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
			</svg>
			<span class="text-sm font-semibold text-white">Filtros</span>
			{#if activeFilterCount > 0}
				<span class="text-xs px-1.5 py-0.5 rounded-full bg-amber-500 text-black font-bold">{activeFilterCount}</span>
			{/if}
		</div>
		<div class="flex items-center gap-2">
			{#if activeFilterCount > 0}
				<button
					onclick={clearFilters}
					class="text-xs text-surface-400 hover:text-amber-400 transition-colors"
				>
					Limpar
				</button>
			{/if}
			{#if onClose}
				<button
					onclick={onClose}
					class="p-1 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
					aria-label="Fechar filtros"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			{/if}
		</div>
	</div>

	<div class="flex-1 overflow-y-auto p-4 space-y-5">
		<!-- Fuel type -->
		<div>
			<label for="fuel-type" class="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
				Combustível
			</label>
			<select
				id="fuel-type"
				class="w-full text-sm rounded-lg border border-white/10 bg-surface-800 text-white px-3 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
				value={filters.fuelTypeId}
				onchange={(e) => {
					filters.fuelTypeId = Number((e.target as HTMLSelectElement).value);
					onFuelTypeChange();
				}}
			>
				{#each fuelTypes as ft (ft.Id)}
					<option value={ft.Id}>{ft.Descritivo}</option>
				{/each}
			</select>
		</div>

		<!-- Near Me -->
		<div>
			<p class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Localização</p>

			<button
				onclick={handleNearMeToggle}
				class={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border ${
					filters.nearMe
						? 'bg-blue-900/40 border-blue-500/50 text-blue-300'
						: 'bg-surface-800 border-white/10 text-surface-300 hover:border-white/20 hover:text-white'
				}`}
			>
				{#if userLocation.loading}
					<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
						<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"></path>
					</svg>
				{:else}
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				{/if}
				{filters.nearMe ? 'Perto de mim ✓' : 'Perto de mim'}
			</button>

			{#if userLocation.error}
				<p class="mt-1.5 text-xs text-red-400">{userLocation.error}</p>
			{/if}

			{#if filters.nearMe}
				<div class="mt-3">
					<p class="text-xs text-surface-400 mb-2">Raio de pesquisa</p>
					<div class="flex gap-1.5 flex-wrap">
						{#each RADIUS_OPTIONS as km (km)}
							<button
								onclick={() => (filters.radiusKm = km)}
								class={`text-xs px-2.5 py-1 rounded-full border transition-all ${
									filters.radiusKm === km
										? 'bg-blue-600 border-blue-500 text-white font-semibold'
										: 'border-white/10 text-surface-400 hover:border-white/20 hover:text-white'
								}`}
							>
								{km} km
							</button>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<!-- District + Municipality (hidden when Near Me active) -->
		{#if !filters.nearMe}
			<div>
				<label for="district" class="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
					Distrito
				</label>
				<select
					id="district"
					class="w-full text-sm rounded-lg border border-white/10 bg-surface-800 text-white px-3 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
					value={filters.districtId ?? ''}
					onchange={(e) => {
						const v = (e.target as HTMLSelectElement).value;
						filters.districtId = v ? Number(v) : null;
						onFuelTypeChange(); // refetch with new district
					}}
				>
					<option value="">Todos os distritos</option>
					{#each districts as d (d.Id)}
						<option value={d.Id}>{d.Descritivo}</option>
					{/each}
				</select>
			</div>

			{#if filteredMunicipalities.length > 0}
				<div>
					<label for="municipality" class="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
						Município
					</label>
					<select
						id="municipality"
						class="w-full text-sm rounded-lg border border-white/10 bg-surface-800 text-white px-3 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
						value={filters.municipalityIds[0] ?? ''}
						onchange={(e) => {
							const v = (e.target as HTMLSelectElement).value;
							filters.municipalityIds = v ? [Number(v)] : [];
							onFuelTypeChange(); // refetch with new municipality
						}}
					>
						<option value="">Todos os municípios</option>
						{#each filteredMunicipalities as m (m.Id)}
							<option value={m.Id}>{m.Descritivo}</option>
						{/each}
					</select>
				</div>
			{/if}
		{/if}

		<!-- Brand -->
		<div>
			<label for="brand" class="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
				Marca
			</label>
			<select
				id="brand"
				class="w-full text-sm rounded-lg border border-white/10 bg-surface-800 text-white px-3 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
				value={filters.brandId ?? ''}
				onchange={(e) => {
					const v = (e.target as HTMLSelectElement).value;
					filters.brandId = v ? Number(v) : null;
				}}
			>
				<option value="">Todas as marcas</option>
				{#each brands as b (b.Id)}
					<option value={b.Id}>{b.Descritivo}</option>
				{/each}
			</select>
		</div>

		<!-- Sort -->
		<div>
			<p class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Ordenar por</p>
			<div class="grid grid-cols-2 gap-1.5">
				{#each [
					{ value: 'price_asc', label: 'Preço ↑' },
					{ value: 'price_desc', label: 'Preço ↓' },
					{ value: 'distance_asc', label: 'Distância ↑' },
					{ value: 'name_asc', label: 'Nome A–Z' },
				] as opt (opt.value)}
					<button
						onclick={() => (filters.sortBy = opt.value as typeof filters.sortBy)}
						class={`text-xs px-2 py-1.5 rounded-lg border transition-all ${
							filters.sortBy === opt.value
								? 'bg-amber-600 border-amber-500 text-black font-semibold'
								: 'border-white/10 text-surface-400 hover:border-white/20 hover:text-white'
						}`}
					>
						{opt.label}
					</button>
				{/each}
			</div>
		</div>
		<!-- Max price -->
		<div>
			<label for="max-price" class="block text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">
				Preço máximo (€/L)
			</label>
			<div class="flex gap-2 items-center">
				<input
					id="max-price"
					type="number"
					step="0.001"
					min="0"
					max="5"
					placeholder="Ex: 1.800"
					class="flex-1 text-sm rounded-lg border border-white/10 bg-surface-800 text-white px-3 py-2 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
					value={filters.maxPrice ?? ''}
					oninput={(e) => {
						const v = parseFloat((e.target as HTMLInputElement).value);
						filters.maxPrice = isNaN(v) ? null : v;
					}}
				/>
				{#if filters.maxPrice !== null}
					<button
						onclick={() => { filters.maxPrice = null; }}
						class="p-2 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors flex-shrink-0"
						aria-label="Limpar preço máximo"
					>
						<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
						</svg>
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Footer: count + reload -->
	<div class="flex items-center justify-between px-4 py-3 border-t border-white/8 flex-shrink-0">
		<span class="text-xs text-surface-500">{stationCount} postos visíveis</span>
		<button
			onclick={onReload}
			class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-white/10 text-surface-400 hover:text-white hover:border-amber-500/50 hover:bg-amber-500/10 transition-all"
		>
			<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
			</svg>
			Atualizar
		</button>
	</div>
</div>

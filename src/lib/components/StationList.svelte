<script lang="ts">
	import type { Station } from '$lib/api/types';
	import StationCard from './StationCard.svelte';
	import { parsePrice } from '$lib/utils/price';
	import { haversine } from '$lib/utils/geo';

	interface Props {
		stations: Station[];
		userLat: number | null;
		userLon: number | null;
		loading: boolean;
		error: string | null;
		onSelectStation: (id: number) => void;
	}

	let { stations, userLat, userLon, loading, error, onSelectStation }: Props = $props();

	const prices = $derived(
		stations.map((s) => parsePrice(s.Preco)).filter((p): p is number => p !== null)
	);
	const priceMin = $derived(prices.length ? Math.min(...prices) : 0);
	const priceMax = $derived(prices.length ? Math.max(...prices) : 0);

	function getDistance(s: Station): number | null {
		if (userLat === null || userLon === null) return null;
		if (!s.Latitude || !s.Longitude) return null;
		return haversine(userLat, userLon, s.Latitude, s.Longitude);
	}
</script>

<div class="flex flex-col h-full">
	<!-- Stats bar -->
	<div class="flex items-center justify-between px-3 py-2 border-b border-white/8 bg-surface-900/50 text-xs text-surface-400 flex-shrink-0">
		<span>
			{#if loading}
				<span class="animate-pulse">A carregar...</span>
			{:else}
				<span class="text-white font-semibold">{stations.length}</span> postos encontrados
			{/if}
		</span>
		{#if priceMin > 0}
			<span>
				<span class="text-green-400 font-semibold">{priceMin.toFixed(3)}€</span>
				–
				<span class="text-red-400 font-semibold">{priceMax.toFixed(3)}€</span>
			</span>
		{/if}
	</div>

	<!-- Station cards -->
	<div class="flex-1 overflow-y-auto p-2 space-y-1.5">
		{#if loading}
			{#each { length: 8 } as _, i (i)}
				<div class="rounded-lg border border-white/8 bg-surface-900/60 p-3 animate-pulse">
					<div class="flex gap-3">
						<div class="w-9 h-9 rounded-md bg-surface-700"></div>
						<div class="flex-1 space-y-2">
							<div class="h-3 bg-surface-700 rounded w-3/4"></div>
							<div class="h-2.5 bg-surface-700 rounded w-1/2"></div>
						</div>
					</div>
				</div>
			{/each}
		{:else if error}
			<div class="flex flex-col items-center justify-center h-40 text-center text-surface-400 px-4">
				<svg class="w-8 h-8 mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<p class="text-sm">{error}</p>
			</div>
		{:else if stations.length === 0}
			<div class="flex flex-col items-center justify-center h-40 text-center text-surface-400 px-4">
				<svg class="w-8 h-8 mb-2 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<p class="text-sm">Nenhum posto encontrado com os filtros atuais.</p>
			</div>
		{:else}
			{#each stations as station (station.Id)}
				<StationCard
					{station}
					distance={getDistance(station)}
					{priceMin}
					{priceMax}
					onClick={() => onSelectStation(station.Id)}
				/>
			{/each}
		{/if}
	</div>
</div>

<script lang="ts">
	import type { Station } from '$lib/api/types';
	import { parsePrice, priceLabel } from '$lib/utils/price';

	interface Props {
		station: Station;
		distance: number | null;
		priceMin: number;
		priceMax: number;
		onClick: () => void;
	}

	let { station, distance, priceMin, priceMax, onClick }: Props = $props();

	const price = $derived(parsePrice(station.Preco));
	const label = $derived(priceLabel(price, priceMin, priceMax));

	const labelClass = $derived(
		label === 'cheap' ? 'text-green-400 border-green-500/30 bg-green-900/20'
		: label === 'expensive' ? 'text-red-400 border-red-500/30 bg-red-900/20'
		: 'text-amber-400 border-amber-500/30 bg-amber-900/20'
	);

	const dotClass = $derived(
		label === 'cheap' ? 'bg-green-500'
		: label === 'expensive' ? 'bg-red-500'
		: 'bg-amber-500'
	);

	const brandInitial = $derived((station.Marca ?? '?').charAt(0).toUpperCase());
</script>

<button
	class="w-full text-left rounded-lg border border-white/8 bg-surface-900/60 hover:bg-surface-800/80 hover:border-amber-500/30 transition-all duration-150 p-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
	onclick={onClick}
>
	<div class="flex items-start gap-3">
		<!-- Brand avatar -->
		<div class="flex-shrink-0 w-9 h-9 rounded-md bg-surface-700 flex items-center justify-center text-sm font-bold text-amber-400 border border-white/10">
			{brandInitial}
		</div>

		<div class="flex-1 min-w-0">
			<!-- Name + price -->
			<div class="flex items-baseline justify-between gap-2">
				<span class="text-sm font-semibold text-white truncate group-hover:text-amber-100 transition-colors">
					{station.Nome}
				</span>
				<span class={`flex-shrink-0 text-sm font-bold px-2 py-0.5 rounded border text-right tabular-nums ${labelClass}`}>
					<span class={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${dotClass} align-middle`}></span>
					{station.Preco ?? '—'}
				</span>
			</div>

			<!-- Meta row -->
			<div class="flex items-center gap-2 mt-1 text-xs text-surface-400">
				{#if station.Marca}
					<span class="text-surface-300">{station.Marca}</span>
					<span>·</span>
				{/if}
				<span class="truncate">{station.Localidade ?? station.Municipio ?? station.Distrito ?? ''}</span>
				{#if distance !== null}
					<span>·</span>
					<span class="flex-shrink-0 text-blue-400">{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</span>
				{/if}
			</div>

			<!-- Update date -->
			{#if station.DataAtualizacao}
				<div class="text-xs text-surface-500 mt-0.5">
					Atualizado: {station.DataAtualizacao.split(' ')[0]}
				</div>
			{/if}
		</div>
	</div>
</button>

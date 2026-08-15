<script lang="ts">
	import type { StationDetail } from '$lib/api/types';

	interface Props {
		detail: StationDetail | null;
		loading: boolean;
		error?: string | null;
		onClose: () => void;
	}

	let { detail, loading, error = null, onClose }: Props = $props();

	// Use !! so that undefined (possible if API returns unexpected shape) is treated as falsy
	const open = $derived(loading || !!detail || !!error);

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') onClose();
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
		role="dialog"
		aria-modal="true"
		tabindex="-1"
		onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
		onkeydown={(e) => { if (e.key === 'Escape') onClose(); }}
	>
		<!-- Panel -->
		<div class="w-full sm:max-w-lg bg-surface-900 border border-white/10 sm:rounded-xl overflow-hidden shadow-2xl max-h-[90dvh] flex flex-col">

			<!-- Header — always visible so user always has an escape -->
			<div class="flex items-start justify-between p-4 border-b border-white/8 flex-shrink-0">
				<div class="flex-1 min-w-0">
					{#if loading}
						<div class="h-5 bg-surface-700 rounded w-2/3 animate-pulse"></div>
						<div class="h-3 bg-surface-700 rounded w-1/3 mt-2 animate-pulse"></div>
					{:else if detail}
						<h2 class="text-lg font-bold text-white leading-tight">{detail.Nome ?? '—'}</h2>
						<p class="text-sm text-surface-400 mt-0.5">
							{detail.Marca ?? ''}
							{#if detail.TipoPosto}· {detail.TipoPosto}{/if}
							{#if detail.Utilizacao}· {detail.Utilizacao}{/if}
						</p>
					{:else if error}
						<p class="text-sm font-semibold text-red-400">Erro ao carregar posto</p>
						<p class="text-xs text-surface-500 mt-0.5">{error}</p>
					{/if}
				</div>
				<!-- Always-visible close button -->
				<button
					onclick={onClose}
					class="flex-shrink-0 ml-3 p-1.5 rounded-lg text-surface-400 hover:text-white hover:bg-surface-700 transition-colors"
					aria-label="Fechar"
				>
					<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>

			<!-- Content -->
			{#if loading}
				<div class="p-4 animate-pulse space-y-4 overflow-y-auto flex-1">
					<div class="grid grid-cols-2 gap-3">
						{#each { length: 4 } as _, i (i)}
							<div class="h-10 bg-surface-700 rounded"></div>
						{/each}
					</div>
					<div class="h-3 bg-surface-700 rounded w-full"></div>
					<div class="h-3 bg-surface-700 rounded w-3/4"></div>
				</div>
			{:else if detail}
				<div class="overflow-y-auto flex-1 p-4 space-y-5">
					<!-- Address -->
					{#if detail.Morada}
						<div>
							<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Localização</h3>
							<p class="text-sm text-surface-200">
								{#if detail.Morada.Morada}{detail.Morada.Morada},{/if}
								{detail.Morada.Localidade ?? ''}<br />
								{detail.Morada.CodPostal ?? ''} · {detail.Morada.Municipio ?? ''}, {detail.Morada.Distrito ?? ''}
							</p>
						</div>
					{/if}

					<!-- Fuel prices -->
					{#if detail.Combustiveis?.length}
						<div>
							<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Preços</h3>
							<div class="space-y-1.5">
								{#each detail.Combustiveis as fuel (fuel.TipoCombustivel)}
									<div class="flex items-center justify-between rounded-lg bg-surface-800/60 border border-white/6 px-3 py-2">
										<span class="text-sm text-surface-200">{fuel.TipoCombustivel}</span>
										<div class="text-right">
											<span class="text-sm font-bold text-amber-400">{fuel.Preco}</span>
											{#if fuel.DataAtualizacao && !fuel.DataAtualizacao.startsWith('0001')}
												<p class="text-xs text-surface-500">{fuel.DataAtualizacao.split(' ')[0]}</p>
											{/if}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Hours -->
					{#if detail.HorarioPosto}
						<div>
							<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Horário</h3>
							<div class="grid grid-cols-2 gap-1.5 text-sm">
								<div class="rounded-lg bg-surface-800/60 border border-white/6 px-3 py-2">
									<p class="text-xs text-surface-500 mb-0.5">Dias úteis</p>
									<p class="font-medium text-surface-200">{detail.HorarioPosto.DiasUteis || '—'}</p>
								</div>
								<div class="rounded-lg bg-surface-800/60 border border-white/6 px-3 py-2">
									<p class="text-xs text-surface-500 mb-0.5">Sábado</p>
									<p class="font-medium text-surface-200">{detail.HorarioPosto.Sabado || '—'}</p>
								</div>
								<div class="rounded-lg bg-surface-800/60 border border-white/6 px-3 py-2">
									<p class="text-xs text-surface-500 mb-0.5">Domingo</p>
									<p class="font-medium text-surface-200">{detail.HorarioPosto.Domingo || '—'}</p>
								</div>
								<div class="rounded-lg bg-surface-800/60 border border-white/6 px-3 py-2">
									<p class="text-xs text-surface-500 mb-0.5">Feriado</p>
									<p class="font-medium text-surface-200">{detail.HorarioPosto.Feriado || '—'}</p>
								</div>
							</div>
						</div>
					{/if}

					<!-- Services -->
					{#if detail.Servicos?.length}
						<div>
							<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Serviços</h3>
							<div class="flex flex-wrap gap-1.5">
								{#each detail.Servicos as s (s.Descritivo)}
									<span class="text-xs px-2 py-1 rounded-full border border-white/10 bg-surface-800/60 text-surface-300">
										{s.Descritivo}
									</span>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Payment -->
					{#if detail.MeiosPagamento?.length}
						<div>
							<h3 class="text-xs font-semibold text-surface-400 uppercase tracking-wider mb-2">Pagamento</h3>
							<div class="flex flex-wrap gap-1.5">
								{#each detail.MeiosPagamento as p (p.Descritivo)}
									<span class="text-xs px-2 py-1 rounded-full border border-white/10 bg-surface-800/60 text-surface-300">
										{p.Descritivo}
									</span>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{/if}

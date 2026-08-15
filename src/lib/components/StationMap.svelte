<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Station } from '$lib/api/types';
	import { parsePrice, priceLabel } from '$lib/utils/price';

	interface Props {
		stations: Station[];
		userLat: number | null;
		userLon: number | null;
		radiusKm: number;
		showRadius: boolean;
		onSelectStation: (id: number) => void;
	}

	let { stations, userLat, userLon, radiusKm, showRadius, onSelectStation }: Props = $props();

	let mapEl: HTMLDivElement;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let L: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let map: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let markersLayer: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let userMarker: any = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let radiusCircle: any = null;
	let mounted = $state(false);

	onMount(async () => {
		const mod = await import('leaflet');
		L = mod.default ?? mod;

		map = L.map(mapEl, { zoomControl: true }).setView([39.5, -8], 7);

		L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
			attribution:
				'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
			subdomains: 'abcd',
			maxZoom: 19
		}).addTo(map);

		markersLayer = L.layerGroup().addTo(map);
		mounted = true;
	});

	onDestroy(() => {
		map?.remove();
	});

	function getPriceRange(list: Station[]): { min: number; max: number } {
		const prices = list
			.map((s) => parsePrice(s.Preco))
			.filter((p): p is number => p !== null);
		if (!prices.length) return { min: 0, max: 0 };
		return { min: Math.min(...prices), max: Math.max(...prices) };
	}

	// Redraw markers whenever stations list changes
	$effect(() => {
		if (!mounted || !map || !L || !markersLayer) return;

		markersLayer.clearLayers();

		const { min, max } = getPriceRange(stations);
		// Limit to 800 markers for performance; user can zoom/filter to see more
		const visible = stations.filter((s) => s.Latitude && s.Longitude).slice(0, 800);

		for (const station of visible) {
			const price = parsePrice(station.Preco);
			const label = priceLabel(price, min, max);
			const displayPrice = price !== null ? price.toFixed(3) : '?';

			const icon = L.divIcon({
				html: `<div class="gas-marker ${label}">${displayPrice}</div>`,
				className: '',
				iconSize: L.point(54, 22),
				iconAnchor: L.point(27, 22),
				popupAnchor: L.point(0, -26)
			});

			const marker = L.marker([station.Latitude, station.Longitude], { icon });
			marker.bindPopup(
				`<div style="color:#fff;background:#1e1e2e;padding:10px 12px;border-radius:8px;min-width:190px;font-family:system-ui,sans-serif">
					<div style="font-weight:700;font-size:14px;margin-bottom:4px;line-height:1.3">${station.Nome}</div>
					<div style="color:#f59e0b;font-size:17px;font-weight:700">${station.Preco ?? '—'}</div>
					<div style="color:#9ca3af;font-size:12px;margin-top:3px">${station.Marca ?? ''}${station.Marca && station.Localidade ? ' · ' : ''}${station.Localidade ?? station.Municipio ?? ''}</div>
					<button onclick="window.__selectStation(${station.Id})" style="margin-top:9px;background:#f59e0b;color:#000;border:none;border-radius:5px;padding:5px 12px;cursor:pointer;font-weight:700;font-size:12px;width:100%">Ver detalhes ›</button>
				</div>`,
				{ className: 'gas-popup' }
			);

			markersLayer.addLayer(marker);
		}
	});

	// Update user location marker + radius circle
	$effect(() => {
		if (!mounted || !map || !L) return;

		userMarker?.remove();
		radiusCircle?.remove();
		userMarker = null;
		radiusCircle = null;

		if (userLat !== null && userLon !== null) {
			userMarker = L.circleMarker([userLat, userLon], {
				radius: 10,
				fillColor: '#3b82f6',
				fillOpacity: 0.9,
				color: '#fff',
				weight: 2
			}).addTo(map);

			if (showRadius) {
				radiusCircle = L.circle([userLat, userLon], {
					radius: radiusKm * 1000,
					fillColor: '#3b82f6',
					fillOpacity: 0.06,
					color: '#3b82f6',
					weight: 1.5,
					dashArray: '6 4'
				}).addTo(map);

				map.fitBounds(radiusCircle.getBounds(), { padding: [20, 20] });
			} else {
				map.setView([userLat, userLon], 13, { animate: true });
			}
		}
	});

	export function flyToPortugal() {
		map?.setView([39.5, -8], 7, { animate: true });
	}

	export function flyToStation(lat: number, lon: number) {
		map?.setView([lat, lon], 15, { animate: true });
	}
</script>

<div bind:this={mapEl} class="w-full h-full" style="min-height:300px"></div>

<style>
	:global(.gas-popup .leaflet-popup-content-wrapper) {
		background: #1e1e2e;
		border: 1px solid rgba(245, 158, 11, 0.3);
		border-radius: 8px;
		padding: 0;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
	}
	:global(.gas-popup .leaflet-popup-tip) {
		background: #1e1e2e;
	}
	:global(.gas-popup .leaflet-popup-content) {
		margin: 0;
	}
</style>

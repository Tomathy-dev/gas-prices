<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { Station } from '$lib/api/types';
	import { parsePrice, priceLabel } from '$lib/utils/price';
	import Supercluster from 'supercluster';

	interface Props {
		stations: Station[];
		userLat: number | null;
		userLon: number | null;
		radiusKm: number;
		showRadius: boolean;
		selectedStationId: number | null;
		onSelectStation: (id: number) => void;
	}

	let { stations, userLat, userLon, radiusKm, showRadius, selectedStationId, onSelectStation }: Props = $props();

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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let clusterIndex: any = null;
	let priceMin = 0;
	let priceMax = 0;

	function buildIndex(list: Station[]) {
		const sc = new Supercluster({ radius: 60, maxZoom: 16 });
		sc.load(
			list
				.filter((s) => s.Latitude && s.Longitude)
				.map((s) => ({
					type: 'Feature' as const,
					geometry: { type: 'Point' as const, coordinates: [s.Longitude!, s.Latitude!] },
					properties: {
						id: s.Id,
						preco: s.Preco,
						nome: s.Nome,
						marca: s.Marca ?? '',
						localidade: s.Localidade ?? s.Municipio ?? ''
					}
				}))
		);
		const prices = list.map((s) => parsePrice(s.Preco)).filter((p): p is number => p !== null);
		priceMin = prices.length ? Math.min(...prices) : 0;
		priceMax = prices.length ? Math.max(...prices) : 0;
		return sc;
	}

	function updateMarkers() {
		if (!mounted || !map || !L || !markersLayer || !clusterIndex) return;

		markersLayer.clearLayers();

		const bounds = map.getBounds();
		const zoom = Math.floor(map.getZoom());
		const bbox: [number, number, number, number] = [
			bounds.getWest(),
			bounds.getSouth(),
			bounds.getEast(),
			bounds.getNorth()
		];

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const clusters: any[] = clusterIndex.getClusters(bbox, zoom);

		for (const feature of clusters) {
			const [lon, lat] = feature.geometry.coordinates;
			const props = feature.properties;

			if (props.cluster) {
				// Cluster circle badge
				const count: number = props.point_count;
				const size = count < 10 ? 34 : count < 50 ? 42 : count < 200 ? 50 : 58;
				const icon = L.divIcon({
					html: `<div class="cluster-marker" style="width:${size}px;height:${size}px;font-size:${size < 42 ? 11 : 13}px">${count}</div>`,
					className: '',
					iconSize: L.point(size, size),
					iconAnchor: L.point(size / 2, size / 2)
				});
				const marker = L.marker([lat, lon], { icon });
				marker.on('click', () => {
					const expansion = clusterIndex.getClusterExpansionZoom(props.cluster_id);
					map.flyTo([lat, lon], Math.min(expansion, 18), { animate: true, duration: 0.4 });
				});
				markersLayer.addLayer(marker);
			} else {
				// Individual station marker
				const price = parsePrice(props.preco);
				const label = priceLabel(price, priceMin, priceMax);
				const displayPrice = price !== null ? price.toFixed(3) : '?';
				const isSelected = props.id === selectedStationId;

				const w = isSelected ? 64 : 54;
				const h = isSelected ? 26 : 22;
				const icon = L.divIcon({
					html: `<div class="gas-marker ${label}${isSelected ? ' selected' : ''}">${displayPrice}</div>`,
					className: '',
					iconSize: L.point(w, h),
					iconAnchor: L.point(w / 2, h),
					popupAnchor: L.point(0, -(h + 4))
				});

				const marker = L.marker([lat, lon], { icon, zIndexOffset: isSelected ? 1000 : 0 });
				marker.bindPopup(
					`<div style="color:#fff;background:#1e1e2e;padding:10px 12px;border-radius:8px;min-width:190px;font-family:system-ui,sans-serif">
						<div style="font-weight:700;font-size:14px;margin-bottom:4px;line-height:1.3">${props.nome}</div>
						<div style="color:#f59e0b;font-size:17px;font-weight:700">${props.preco ?? '—'}</div>
						<div style="color:#9ca3af;font-size:12px;margin-top:3px">${props.marca}${props.marca && props.localidade ? ' · ' : ''}${props.localidade}</div>
						<button onclick="window.__selectStation(${props.id})" style="margin-top:9px;background:#f59e0b;color:#000;border:none;border-radius:5px;padding:5px 12px;cursor:pointer;font-weight:700;font-size:12px;width:100%">Ver detalhes ›</button>
					</div>`,
					{ className: 'gas-popup' }
				);
				markersLayer.addLayer(marker);
			}
		}
	}

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
		map.on('moveend', updateMarkers);
		mounted = true;
	});

	onDestroy(() => {
		if (map) {
			map.off('moveend', updateMarkers);
			map.remove();
		}
	});

	// Rebuild cluster index when stations list changes
	$effect(() => {
		const list = stations;
		if (!mounted) return;
		clusterIndex = buildIndex(list);
		updateMarkers();
	});

	// Re-render markers when selected station changes (highlight update)
	$effect(() => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const _id = selectedStationId;
		updateMarkers();
	});

	// User location marker + radius circle
	$effect(() => {
		const lat = userLat;
		const lon = userLon;
		const r = radiusKm;
		const sr = showRadius;
		if (!mounted || !map || !L) return;

		userMarker?.remove();
		radiusCircle?.remove();
		userMarker = null;
		radiusCircle = null;

		if (lat !== null && lon !== null) {
			userMarker = L.circleMarker([lat, lon], {
				radius: 10,
				fillColor: '#3b82f6',
				fillOpacity: 0.9,
				color: '#fff',
				weight: 2
			}).addTo(map);

			if (sr) {
				radiusCircle = L.circle([lat, lon], {
					radius: r * 1000,
					fillColor: '#3b82f6',
					fillOpacity: 0.06,
					color: '#3b82f6',
					weight: 1.5,
					dashArray: '6 4'
				}).addTo(map);
				map.fitBounds(radiusCircle.getBounds(), { padding: [20, 20] });
			} else {
				map.setView([lat, lon], 13, { animate: true });
			}
		}
	});

	export function flyToPortugal() {
		map?.setView([39.5, -8], 7, { animate: true });
	}

	export function flyToStation(lat: number, lon: number) {
		map?.setView([lat, lon], 16, { animate: true, duration: 0.5 });
	}
</script>

<div bind:this={mapEl} class="w-full h-full" style="min-height:300px; isolation:isolate"></div>

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

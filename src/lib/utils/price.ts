export function parsePrice(preco: string | null | undefined): number | null {
	if (!preco) return null;
	const normalised = preco.replace(',', '.');
	const match = normalised.match(/[\d.]+/);
	if (!match) return null;
	const v = parseFloat(match[0]);
	return isNaN(v) ? null : v;
}

export function formatPrice(preco: string | null | undefined): string {
	if (!preco) return '—';
	return preco.replace(' €/litro', ' €/L').replace(' €/kg', ' €/kg').replace(' €/m3', ' €/m³');
}

export function priceColor(price: number | null, min: number, max: number): string {
	if (price === null) return '#6b7280';
	if (max <= min) return '#f59e0b';
	const t = (price - min) / (max - min);
	if (t < 0.33) return '#22c55e';
	if (t < 0.67) return '#f59e0b';
	return '#ef4444';
}

export function priceLabel(price: number | null, min: number, max: number): 'cheap' | 'mid' | 'expensive' | 'unknown' {
	if (price === null) return 'unknown';
	if (max <= min) return 'mid';
	const t = (price - min) / (max - min);
	if (t < 0.33) return 'cheap';
	if (t < 0.67) return 'mid';
	return 'expensive';
}

let lat = $state<number | null>(null);
let lon = $state<number | null>(null);
let loading = $state(false);
let error = $state<string | null>(null);

export const userLocation = {
	get lat() { return lat; },
	get lon() { return lon; },
	get loading() { return loading; },
	get error() { return error; },
	get hasLocation() { return lat !== null && lon !== null; },

	async request(): Promise<boolean> {
		if (!navigator?.geolocation) {
			error = 'Geolocalização não suportada neste navegador.';
			return false;
		}
		loading = true;
		error = null;
		return new Promise<boolean>((resolve) => {
			navigator.geolocation.getCurrentPosition(
				(pos) => {
					lat = pos.coords.latitude;
					lon = pos.coords.longitude;
					loading = false;
					resolve(true);
				},
				(err) => {
					error = err.code === 1
						? 'Permissão de localização negada.'
						: 'Não foi possível obter a localização.';
					loading = false;
					resolve(false);
				},
				{ timeout: 10000 }
			);
		});
	},

	clear() {
		lat = null;
		lon = null;
		error = null;
	}
};

# GasPT — Preços de Combustível em Portugal

A modern, fast web app for tracking real-time gas prices across Portuguese fuel stations — built as an improved alternative to [precoscombustiveis.dgeg.gov.pt](https://precoscombustiveis.dgeg.gov.pt/).

**Live app:** [tomathy-dev.github.io/gas-prices](https://tomathy-dev.github.io/gas-prices/)

---

## Features

- **Interactive dark map** — CartoDB Dark Matter tiles with price-colored markers (green → amber → red by price quartile)
- **Near Me** — GPS-based filter with configurable radius: 5, 10, 25, 50, or 100 km
- **Filter by brand** — Galp, BP, Repsol, Prio, Intermarché, and more
- **Filter by district & municipality**
- **Sort** by price ascending/descending, distance, or name
- **Station detail modal** — all fuel types and prices, opening hours (weekdays/Saturday/Sunday/holidays), services, and payment methods
- **3 000+ stations** loaded in a single request; all filtering done client-side — no lag on filter changes
- **Mobile-first** — filter drawer, map/list tab toggle, full-height map on mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [SvelteKit 2](https://kit.svelte.dev/) · Svelte 5 (runes mode) |
| Styling | [TailwindCSS v4](https://tailwindcss.com/) · [Skeleton UI v3](https://www.skeleton.dev/) |
| Map | [Leaflet.js](https://leafletjs.com/) · CartoDB Dark Matter tiles |
| Language | TypeScript |
| Deployment | GitHub Pages via GitHub Actions |
| Data | [DGEG Public API](https://precoscombustiveis.dgeg.gov.pt/) — free for non-commercial use |

---

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Type checking

```bash
npm run check
```

### Production build (local)

```bash
npm run build
npm run preview
```

---

## Deployment

The app is automatically built and deployed to GitHub Pages on every push to `main`.

### First-time setup

1. Go to your repo → **Settings** → **Pages**
2. Under **Source**, select **GitHub Actions**
3. Push to `main` — the workflow builds and deploys automatically

The live URL will be: `https://<your-username>.github.io/gas-prices/`

---

## Data Source

All gas price data is sourced from the **DGEG** (Direção-Geral de Energia e Geologia) public API. The API is free to use for non-commercial purposes. Prices are updated daily by the stations themselves and reflected in the API.

API base URL: `https://precoscombustiveis.dgeg.gov.pt/api/PrecoComb/`

Key endpoints used:
- `PesquisarPostos` — station search with lat/lon and current prices (~3 000 stations per fuel type)
- `GetDadosPosto` — full station detail (all fuel types, hours, services, payment)
- `GetTiposCombustiveis`, `GetMarcas`, `GetDistritos`, `GetMunicipios` — reference data

---

## License

MIT — see [LICENSE](LICENSE)

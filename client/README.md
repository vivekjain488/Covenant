# Covenant UI

React (Vite) dashboard for Covenant: policies, integrations, threats, audit view, and live API-backed metrics.

## Setup

```bash
npm install
cp .env.example .env.local   # edit VITE_* vars — see ENVIRONMENT.md
npm run dev
```

## Environment

| Variable | Notes |
|----------|--------|
| `VITE_API_URL` | API origin. **`""` empty string** → same-origin `/api/*` for Docker/nginx. Omit or set to `http://localhost:3000` for local API. |
| `VITE_COVENANT_API_KEY` | Mirrors server `COVENANT_API_KEY` when reads are locked down; avoid exposing in public production sites. |

Full stack variables and security model: **[`../ENVIRONMENT.md`](../ENVIRONMENT.md)**.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server |
| `npm run build` | Production bundle |
| `npm run lint` | ESLint |

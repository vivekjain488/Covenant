# Covenant — environment, security, and deployment

Do **not** commit real secrets. Use `.env` / `.env.local` (gitignored). **Template files named `.env.example` are intended to be committed** so new clones know which variables exist.

### Git hygiene

| Location | Ignored / local-only |
|----------|---------------------|
| [`.gitignore`](.gitignore) (root) | `node_modules/`, build caches, `.env*`, **`/server/data/`** (runtime policies / decisions / JSONL) |
| [`server/.gitignore`](server/.gitignore) | `data/`, `violations.json`, `.env` (with `!.env.example` exception) |
| [`client/.gitignore`](client/.gitignore) | `dist`, Vite env locals, `.env` |
| [`contracts/.gitignore`](contracts/.gitignore) | Hardhat `artifacts`, `cache`, `.env` (with `!.env.example`) |
| [`packages/sdk-ts/.gitignore`](packages/sdk-ts/.gitignore) | `dist`, `node_modules` |

If **`server/violations.json`** was committed in an older clone and you want it purely local, run:

```bash
git rm --cached server/violations.json
```

Then rely on **`server/.gitignore`** going forward.

## Repository layout

| Path | Role |
|------|------|
| `client/` | Vite + React UI |
| `server/` | Policy API (`create-app.js`, `routes/api.js`, `lib/*`), persisted data under `server/data/` |
| `contracts/` | Hardhat — `GuardRailRegistry`, deploy scripts |
| `packages/sdk-ts/` | TypeScript `CovenantClient` (`apiKey`, `baseUrl`) |
| `docker-compose.yml` | Production-style stack: API + nginx UI |

---

## Client (`client/`)

Vite picks up committed defaults so the UI bundle does **not** embed localhost into source:

| File | When used |
|------|-----------|
| [`client/.env.development`](client/.env.development) | `vite` / `vite dev` — sets **`VITE_API_URL`** for the Covenant API origin |
| [`client/.env.production`](client/.env.production) | production `vite build` — **`VITE_API_URL=`** empty ⇒ same-origin `/api/*` (Docker/nginx) |

| Variable | Purpose |
|----------|---------|
| `VITE_API_URL` | API origin (**empty string** = same-origin). Not hardcoded in `client/src`; comes only from env files above or CI `docker build --build-arg`. |
| `VITE_COVENANT_API_KEY` | Same value as server `COVENANT_API_KEY` when **`COVENANT_ALLOW_PUBLIC_READ=false`**. Prefer server-side agents; avoid exposing on public origins. |
| `VITE_GENSYN_AXL_URL`, `VITE_AXL_URL` | Optional **display** overrides; live topology uses **`GET /api/integrations/axl/topology`** and server **`GENSYN_AXL_URL`**. |

For custom overrides beyond the committed defaults, copy [`client/.env.example`](client/.env.example) → `client/.env.local`.

---

## Server seed data (`server/config/`)

| File | Override env |
|------|----------------|
| [`default-policies.seed.json`](server/config/default-policies.seed.json) | `COVENANT_DEFAULT_POLICIES_PATH` — initial policies when `data/policies.json` is absent |
| [`demo-scenarios.json`](server/config/demo-scenarios.json) | `DEMO_SCENARIOS_PATH` — payloads for `POST /api/demo/run-scenario` |

---

## Server (`server/`)

### Core

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | HTTP listen port |

### Authentication

| Variable | Purpose |
|----------|---------|
| `COVENANT_API_KEY` | When non-empty, protects mutating routes (`POST`, `PUT`, …). Clients send `Authorization: Bearer <token>` or header `X-Covenant-Key: <token>`. |
| `COVENANT_ALLOW_PUBLIC_READ` | Default **`true`** when you rely on a key: **`GET`** to dashboard-safe paths (`/api/state`, `/api/config`, `/api/events`, `/api/policies`, `/api/audit`, `/api/threats`, `/api/policies/:id/versions`, `/api/agents/:id/score`, `/api/integrations/status`, `/api/integrations/axl/topology`, `/api/integrations/uniswap/probe`) stay readable **without** a key. Set to **`false`** to require the key on **every** path except `/`, `/health`, and `OPTIONS`. |

`/api/config` returns `auth.apiKeyConfigured` and `auth.publicReadEnabled` for the UI.

### Integration keys (readiness flags)

| Variable | Purpose |
|----------|---------|
| `KEEPERHUB_API_KEY` | Shown as configured in `/api/config` when set |
| `UNISWAP_API_KEY` | `x-api-key` for Gateway — never sent to browsers |
| `UNISWAP_TRADING_API_URL` | **Required** for quotes / probe (official host is in [`server/.env.example`](server/.env.example); not embedded in runtime code). |
| `UNISWAP_ROUTER_VERSION` | `x-universal-router-version` header (required for quote + probe). |
| `UNISWAP_PROBE_*` | **All required** together for **`GET /api/integrations/uniswap/probe`**: swapper address, **`UNISWAP_PROBE_TOKEN_IN`**, **`TOKEN_OUT`**, both chain IDs, wei **`AMOUNT`**, **`ROUTING`**, **`SLIPPAGE`**. Paste values suited to your key and chains from `.env.example` as a template. |
| `GENSYN_AXL_URL` | **Required** for **`GET /api/integrations/axl/topology`** (no fallback URL inside the repo). Point at your AXL node's HTTP bridge. |
| `GUARDRAIL_REGISTRY_ADDRESS` | Deployed registry contract address |

### ZeroG signals (dashboard flags only)

Any of these sets `zeroGConfigured` in `/api/config`:

`ZEROG_API_KEY`, `ZEROG_RPC_URL`, `ZERO_G_RPC_URL`, `ZEROG_BUCKET`, or `ZEROG_INDEXER_RPC`

### ZeroG Storage (real audit payload upload)

When **all three** are set, each **ALLOW** from `POST /api/check` also uploads JSON (`covenant_audit_v1`) with `@0gfoundation/0g-ts-sdk` (+ `ethers@6.13.1`). Webhooks remain optional supplements.

| Variable | Purpose |
|----------|---------|
| `ZEROG_INDEXER_RPC` | 0G indexer JSON-RPC endpoint |
| `ZEROG_EVM_RPC_URL` | EVM RPC for gas / contract calls (aliases: `ZERO_G_EVM_RPC`, `ZERO_G_RPC_URL`) |
| `ZEROG_PRIVATE_KEY` | **Server-only** deployer/signing key for uploads (never expose to client) |
| `ZEROG_UPLOAD_REPLICAS` | Passed as `expectedReplica` to the indexer (default `1`) |

`zeroGStorageReady` in **`/api/config`** is **true** when those three prerequisites are satisfied.

### Webhooks (after `POST /api/check` returns **allowed**, parallel to SDK paths)

Fire-and-forget JSON `POST` with body `{ source, event: "execution_allowed", decision }` — Covenant still **never** submits arbitrary swaps here; KeeperHub/custom relay systems execute txs.

| Variable | Purpose |
|----------|---------|
| `KEEPERHUB_WEBHOOK_URL` | Called with `Authorization: Bearer <KEEPERHUB_API_KEY>` when both URL and key exist |
| `ZEROG_AUDIT_WEBHOOK_URL` | Optional HTTP sink redundant to on-network 0G upload |
| `UNISWAP_RELAY_NOTIFY_URL` | Relay / telemetry hook; uses `x-api-key: <UNISWAP_API_KEY>` when both set |

### Persistence

Policies, decisions (hash chain), events, scores, threats: **`server/data/`** (+ `server/violations.json`). In Docker, mount volume **`covenant_data:/app/data`**.

Copy [`server/.env.example`](server/.env.example) → `server/.env`.

---

## Contracts (`contracts/`)

| Variable | Purpose |
|----------|---------|
| `PRIVATE_KEY` | Deployer (networks that need it, e.g. Sepolia) |
| `ETHERSCAN_API_KEY` | Verification |

Deploy example:

```bash
cd contracts && npx hardhat run scripts/deploy.js --network sepolia
```

Then set **`GUARDRAIL_REGISTRY_ADDRESS`** on the server to the deployed registry address.

See [`contracts/.env.example`](contracts/.env.example).

---

## Docker deployment

From the repo root:

```bash
docker compose up --build
```

- **API:** `http://localhost:3000`
- **UI (proxied `/api`):** `http://localhost:8080`

The UI image is built with **`VITE_API_URL=""`** so the browser calls **`/api/...`** on the same host and nginx forwards to the `api` service.

Override secrets via `server/.env` (mounted/env_file in Compose).

Root **`package.json`** scripts: `compose:up`, `compose:down`.

---

## API surface (reference)

| Method | Path | Notes |
|--------|------|--------|
| `POST` | `/api/check` | Preflight enforcement (triggers 0G upload + hooks on ALLOW when configured) |
| `GET` | `/api/state` | Metrics + recent events |
| `GET` | `/api/config` | Integration + auth flags |
| `GET` | `/api/integrations/status` | AXL URL / Uniswap readiness / `zeroGStorageReady` snapshot |
| `GET` | `/api/integrations/axl/topology` | Proxies Gensyn AXL `GET /topology` |
| `GET` | `/api/integrations/uniswap/probe` | Signed CLASSIC gateway probe (`UNISWAP_API_KEY` on server) |
| `POST` | `/api/integrations/uniswap/quote` | Zod-validated body → Uniswap **`POST /quote`**; **requires** `Authorization: Bearer` / `X-Covenant-Key` whenever `COVENANT_API_KEY` is set (mutating route). |
| `POST` | `/api/policies`, `/api/policies/compile` | Policy authoring |
| `GET` | `/api/audit` | Forensics |
| `GET` | `/api/agents/:id/score` | Score |
| `POST` | `/api/demo/run-scenario` | Deterministic demo |

SDK: [`packages/sdk-ts`](packages/sdk-ts) — pass **`apiKey`** when the server uses **`COVENANT_API_KEY`**.

---

## What is still “yours” outside this repo

- **TLS / reverse proxy** (Caddy, Traefik, Cloudflare) in front of Compose.
- **Cluster DB** replacing file-backed policy store at scale.
- **Operational 0G + EVM liquidity** (`ZEROG_INDEXER_RPC` / funded signer) outside local dev defaults.
- **KeeperHub / custom relay** finalizing txs after allow — Covenant supplies policy + webhook + Gateway quotes, not delegated execution unless you wire it downstream.
- **Production identity**: JWT tenants, rate limits.

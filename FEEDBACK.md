# Uniswap API & Developer Platform — builder feedback

This file is for **Uniswap Foundation / hackathon prize eligibility** and to document our real integration experience with the **Uniswap Trading API (Gateway)** in **Covenant** ([repo](https://github.com/vivekjain488/Covenant)).

**Where we integrated**

- Server module: `server/lib/integrations/uniswap-trading.js` — `POST {base}/quote` with `x-api-key`, `x-universal-router-version`, JSON body; optional health **probe** using env-driven token pair / chain IDs / amount / routing / slippage.
- Routes: `server/routes/api.js` — `GET /api/integrations/uniswap/probe`, `POST /api/integrations/uniswap/quote` (Zod-validated body), config surfaces `uniswapTradingBase` via `GET /api/config`.
- Env template: `server/.env.example` — documents `UNISWAP_TRADING_API_URL`, `UNISWAP_ROUTER_VERSION`, and all `UNISWAP_PROBE_*` variables (no secrets in repo).

---

## What worked well

1. **Clear separation of concerns** — Gateway base URL + API key + router version as explicit configuration matches how we want **server-side secrets** (keys never shipped to the Vite client).
2. **OpenAPI / docs quality** — The public Trading API contract (e.g. `POST /quote`, `routingPreference`, `slippageTolerance`, numeric `ChainId`) is documented well enough that we could align our probe body with the schema once we read it carefully.
3. **Predictable HTTP errors** — Non-2xx responses with a `detail` string (when present) made it easy to surface **`Uniswap quote ${status}: ${detail}`** to operators without reverse-engineering HTML error pages.

---

## Bugs / pitfalls we hit (DX)

1. **`routingPreference` values** — Early templates used values like `CLASSIC` that do **not** match the public `routingPreference` enum in the docs we used (`BEST_PRICE`, `FASTEST`). That produced confusing 400s until we aligned with the spec. **Suggestion:** add a one-line “invalid enum” hint in error responses listing allowed values for high-traffic fields.
2. **Chain ID types** — The API expects **`tokenInChainId` / `tokenOutChainId` as JSON numbers**, not quoted strings. Sending `"1"` caused validation friction. We fixed this by **coercing integers in `postQuote`** and using integers in the probe. **Suggestion:** document “numeric JSON” prominently in quickstart examples (many integrators stringify from env).
3. **`UNISWAP_API_KEY` alone is insufficient** — A valid key with no `UNISWAP_TRADING_API_URL`, `UNISWAP_ROUTER_VERSION`, or probe env still yields a dead integration. That’s correct for flexibility but easy to misread as “key = working.” **Suggestion:** a single “minimum env checklist” panel in the developer dashboard next to the key.
4. **Process env vs file** — After expanding `.env`, a **long-running Node process** did not pick up new variables until restart; combined with default `dotenv` loading from **cwd**, some runs only saw a subset of vars. We fixed loading with an **absolute path to `server/.env`**. Not Uniswap-specific, but it amplified “probe missing everything” confusion during demos.

---

## Documentation gaps / wishes

1. **Copy-paste “smallest happy quote”** — One canonical curl (headers + minimal `EXACT_INPUT` body for one chain) in the first page of the Trading API quickstart would shorten time-to-first-200.
2. **Probe / health semantics** — We built our own **probe** (fixed pair from env) because we needed a **dashboard green/red** without executing swaps. A **first-party lightweight `/health` or documented probe recipe** (recommended mainnet pair + amount magnitude) would reduce divergence across teams.
3. **`x-universal-router-version`** — We set `2.0` from examples; a short matrix (“if you target X journey, use Y”) in one place would reduce version guesswork for new integrators.
4. **Rate limits & key tiers** — When a probe fails with 401/429, clearer **actionable text** (key scope vs rate limit vs wrong base URL) in docs would help ops.

---

## What we wish existed

- **Sandbox or stable test pair** officially recommended for **connectivity checks** (documented token addresses + chain + min amount) so hackathon apps don’t guess WBTC/WETH/USDC combos.
- **Typed SDK for server-side Node** (or official OpenAPI-generated client) with **runtime validation** matching the live API — we use Zod for our `/quote` proxy body but generated types would stay in sync automatically.

---

## Summary

The Uniswap **Trading API** integration was **worth it**: it let Covenant demonstrate **real routing infrastructure** next to **policy enforcement** (allow/block before execution) without exposing keys to browsers. The main friction was **schema strictness** (enums, numeric chain IDs) and **configuration surface area** (base URL + router version + probe matrix), not fundamental API design. Clearer “first quote in 5 minutes” docs and stricter client-side examples would materially improve DX.

— Covenant team

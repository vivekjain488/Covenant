# Covenant SDK (TypeScript)

Framework-agnostic preflight and audit client for Covenant policy enforcement.

## Quick start

```ts
import { CovenantClient, wrapAgent } from "@covenant/sdk";

const covenant = new CovenantClient({
  baseUrl: "http://127.0.0.1:3000", // required; use "" for same-origin `/api`
  apiKey: process.env.COVENANT_API_KEY, // mirrors server COVENANT_API_KEY when auth is enabled
});

// Alternative in Node scripts only: omit baseUrl if COVENANT_SDK_BASE_URL is set.

const rawSwap = async (payload: { amountWei: string; memo: string }) => {
  // execute transaction
  return { txHash: "0x123" };
};

const protectedSwap = wrapAgent(
  rawSwap,
  covenant,
  (input) => ({
    agentId: "trader-bot.eth",
    policyId: "moderate-agent",
    amountWei: input.amountWei,
    action: "swap",
    protocol: "uniswap",
    pair: "ETH/USDC",
    memo: input.memo,
  }),
);
```

`protectedSwap` throws if Covenant blocks the action.

## Integrations (server-backed)

These call Covenant routes so **Uniswap** and **AXL** keys stay on the API host:

```ts
const status = await covenant.integrationsStatus();
const axl = await covenant.axlTopology(); // { ok, topology }
const probe = await covenant.uniswapGatewayProbe();
// Authenticated quote (needs COVENANT_API_KEY on client when server auth is on):
const quote = await covenant.uniswapQuote({
  swapper: "0x…",
  tokenIn: "0x…",
  tokenOut: "0x…",
  tokenInChainId: "1",
  tokenOutChainId: "1",
  amount: "1000000000000000",
  type: "EXACT_INPUT",
  slippageTolerance: 0.5,
  routingPreference: "CLASSIC",
});
```

See **[`../../ENVIRONMENT.md`](../../ENVIRONMENT.md)** for `UNISWAP_API_KEY`, `GENSYN_AXL_URL`, and 0G Storage env vars.

/**
 * Uniswap Trading API — quotes via configured Gateway URL only (no baked-in endpoints or token addresses).
 * @see https://docs.uniswap.org/
 */

function tradingBaseUrl(config = {}) {
  const u =
    config.uniswapTradingApiUrl !== undefined && config.uniswapTradingApiUrl !== null
      ? config.uniswapTradingApiUrl
      : process.env.UNISWAP_TRADING_API_URL || "";
  return String(u).trim().replace(/\/+$/, "");
}

function requireTradingBase(config) {
  const base = tradingBaseUrl(config);
  if (!base) {
    throw new Error("Set UNISWAP_TRADING_API_URL on the server (see server/.env.example)");
  }
  return base;
}

/**
 * POST /quote with full body (validated by caller). Keeps api key server-side.
 */
async function postQuote(apiKey, body, config = {}) {
  if (!apiKey) {
    throw new Error("Uniswap Trading API requires UNISWAP_API_KEY on the server");
  }
  const base = requireTradingBase(config);
  const routerVersion = String(config.uniswapRouterVersion || process.env.UNISWAP_ROUTER_VERSION || "").trim();
  if (!routerVersion) {
    throw new Error("Set UNISWAP_ROUTER_VERSION (e.g. 2.0) on the server");
  }

  const payload =
    typeof body === "object" && body !== null && !Array.isArray(body)
      ? { ...body }
      : body;
  for (const k of ["tokenInChainId", "tokenOutChainId"]) {
    if (payload && typeof payload === "object" && k in payload) {
      const v = payload[k];
      const n =
        typeof v === "number" && Number.isFinite(v)
          ? Math.trunc(v)
          : typeof v === "string" && /^[0-9]+$/.test(v.trim())
            ? Number.parseInt(v.trim(), 10)
            : NaN;
      if (Number.isFinite(n)) {
        payload[k] = n;
      }
    }
  }

  const res = await fetch(`${base}/quote`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "x-universal-router-version": routerVersion,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof data?.detail === "string" ? data.detail : JSON.stringify(data).slice(0, 280);
    throw new Error(`Uniswap quote ${res.status}: ${detail}`);
  }
  return data;
}

/** Safe public summary for dashboards (no Permit2 payloads). */
function summarizeQuote(full) {
  if (!full || typeof full !== "object") {
    return null;
  }
  const routing = full.routing ?? null;
  const quote = full.quote ?? null;
  return {
    routing,
    tokenIn: quote?.input?.token ?? full.tokenIn ?? null,
    tokenOut: quote?.output?.token ?? full.tokenOut ?? null,
    amountIn: quote?.input?.amount ?? full.amount ?? null,
    amountOut: quote?.output?.amount ?? null,
    chainId: full.tokenInChainId ?? full.chainId ?? null,
  };
}

function collectMissingProbeVars(config = {}) {
  const get = (key, cfgVal) => String(cfgVal ?? process.env[key] ?? "").trim();
  const missing = [];
  if (!tradingBaseUrl(config)) {
    missing.push("UNISWAP_TRADING_API_URL");
  }
  if (!get("UNISWAP_ROUTER_VERSION", config.uniswapRouterVersion)) {
    missing.push("UNISWAP_ROUTER_VERSION");
  }
  const checks = [
    ["UNISWAP_PROBE_SWAPPER", config.uniswapProbeSwapper],
    ["UNISWAP_PROBE_TOKEN_IN", config.uniswapProbeTokenIn],
    ["UNISWAP_PROBE_TOKEN_OUT", config.uniswapProbeTokenOut],
    ["UNISWAP_PROBE_TOKEN_IN_CHAIN_ID", config.uniswapProbeTokenInChainId],
    ["UNISWAP_PROBE_TOKEN_OUT_CHAIN_ID", config.uniswapProbeTokenOutChainId],
    ["UNISWAP_PROBE_AMOUNT", config.uniswapProbeAmount],
    ["UNISWAP_PROBE_ROUTING", config.uniswapProbeRouting],
    ["UNISWAP_PROBE_SLIPPAGE", config.uniswapProbeSlippage],
  ];
  for (const [key, cfgVal] of checks) {
    if (!get(key, cfgVal)) {
      missing.push(key);
    }
  }
  return missing;
}

/** Health probe: every field comes from env / integrationConfig (see server/.env.example). */
async function probeConnectivity(apiKey, config = {}) {
  const missing = collectMissingProbeVars(config);
  if (missing.length > 0) {
    throw new Error(`Uniswap probe missing configuration: ${missing.join(", ")}`);
  }

  const swapper = String(config.uniswapProbeSwapper || process.env.UNISWAP_PROBE_SWAPPER).trim();
  const tokenIn = String(config.uniswapProbeTokenIn || process.env.UNISWAP_PROBE_TOKEN_IN).trim();
  const tokenOut = String(config.uniswapProbeTokenOut || process.env.UNISWAP_PROBE_TOKEN_OUT).trim();
  const tokenInChainIdRaw = String(config.uniswapProbeTokenInChainId || process.env.UNISWAP_PROBE_TOKEN_IN_CHAIN_ID).trim();
  const tokenOutChainIdRaw = String(config.uniswapProbeTokenOutChainId || process.env.UNISWAP_PROBE_TOKEN_OUT_CHAIN_ID).trim();
  const tokenInChainId = Number.parseInt(tokenInChainIdRaw, 10);
  const tokenOutChainId = Number.parseInt(tokenOutChainIdRaw, 10);
  if (!Number.isFinite(tokenInChainId) || !Number.isFinite(tokenOutChainId)) {
    throw new Error("UNISWAP_PROBE_TOKEN_IN_CHAIN_ID and UNISWAP_PROBE_TOKEN_OUT_CHAIN_ID must be integers");
  }
  const amount = String(config.uniswapProbeAmount || process.env.UNISWAP_PROBE_AMOUNT).trim();
  if (!/^[0-9]+$/.test(amount)) {
    throw new Error("UNISWAP_PROBE_AMOUNT must be a positive integer string in token base units");
  }
  const routingPreference = String(config.uniswapProbeRouting || process.env.UNISWAP_PROBE_ROUTING).trim();
  const slippage = Number(String(config.uniswapProbeSlippage ?? process.env.UNISWAP_PROBE_SLIPPAGE).trim());
  if (!Number.isFinite(slippage) || slippage < 0 || slippage > 50) {
    throw new Error("UNISWAP_PROBE_SLIPPAGE must be a number between 0 and 50");
  }

  const body = {
    swapper,
    tokenIn,
    tokenOut,
    tokenInChainId,
    tokenOutChainId,
    amount,
    type: "EXACT_INPUT",
    slippageTolerance: slippage,
    routingPreference,
    generatePermitAsTransaction: false,
  };

  const full = await postQuote(apiKey, body, config);
  return {
    ok: true,
    summary: summarizeQuote(full),
  };
}

module.exports = {
  postQuote,
  probeConnectivity,
  summarizeQuote,
  tradingBaseUrl,
};

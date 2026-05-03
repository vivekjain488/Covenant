require("dotenv").config();

const express = require("express");
const { createCovenantStore } = require("./lib/covenant-store");
const { createApiRouter } = require("./routes/api");
const { apiAuthMiddleware } = require("./lib/auth");

function loadIntegrationConfig(port) {
  const covenantApiKey = process.env.COVENANT_API_KEY || "";
  const zeroGIndexerRpc = process.env.ZEROG_INDEXER_RPC || "";
  const zeroGEvmRpcUrl =
    process.env.ZEROG_EVM_RPC_URL || process.env.ZERO_G_EVM_RPC || process.env.ZERO_G_RPC_URL || "";
  const zeroGPrivateKey = process.env.ZEROG_PRIVATE_KEY || process.env.ZERO_G_PRIVATE_KEY || "";
  const zeroGStorageReady = Boolean(
    String(zeroGIndexerRpc).trim() && String(zeroGEvmRpcUrl).trim() && String(zeroGPrivateKey).trim(),
  );
  return {
    port: Number(port),
    keeperHubApiKey: process.env.KEEPERHUB_API_KEY || "",
    uniswapApiKey: process.env.UNISWAP_API_KEY || "",
    uniswapTradingApiUrl: process.env.UNISWAP_TRADING_API_URL?.trim() || "",
    uniswapRouterVersion: process.env.UNISWAP_ROUTER_VERSION?.trim() || "",
    uniswapProbeSwapper: process.env.UNISWAP_PROBE_SWAPPER?.trim() || "",
    uniswapProbeTokenIn: process.env.UNISWAP_PROBE_TOKEN_IN?.trim() || "",
    uniswapProbeTokenOut: process.env.UNISWAP_PROBE_TOKEN_OUT?.trim() || "",
    uniswapProbeTokenInChainId: process.env.UNISWAP_PROBE_TOKEN_IN_CHAIN_ID?.trim() || "",
    uniswapProbeTokenOutChainId: process.env.UNISWAP_PROBE_TOKEN_OUT_CHAIN_ID?.trim() || "",
    uniswapProbeAmount: process.env.UNISWAP_PROBE_AMOUNT?.trim() || "",
    uniswapProbeRouting: process.env.UNISWAP_PROBE_ROUTING?.trim() || "",
    uniswapProbeSlippage: process.env.UNISWAP_PROBE_SLIPPAGE?.trim() || "",
    gensynAxlUrl: process.env.GENSYN_AXL_URL?.trim() || "",
    covenantRegistryAddress: process.env.GUARDRAIL_REGISTRY_ADDRESS || "",
    zeroGIndexerRpc,
    zeroGEvmRpcUrl,
    zeroGPrivateKey,
    zeroGUploadReplicas: Number.parseInt(process.env.ZEROG_UPLOAD_REPLICAS || "1", 10) || 1,
    zeroGConfigured: Boolean(
      process.env.ZEROG_API_KEY ||
        process.env.ZEROG_RPC_URL ||
        process.env.ZERO_G_RPC_URL ||
        process.env.ZEROG_BUCKET ||
        zeroGIndexerRpc,
    ),
    zeroGStorageReady,
    zeroGApiKey: process.env.ZEROG_API_KEY || "",
    keeperHubWebhookUrl: process.env.KEEPERHUB_WEBHOOK_URL || "",
    zeroGAuditWebhookUrl: process.env.ZEROG_AUDIT_WEBHOOK_URL || "",
    uniswapNotifyUrl: process.env.UNISWAP_RELAY_NOTIFY_URL || "",
    authConfigured: Boolean(String(covenantApiKey).trim()),
    publicReadEnabled: process.env.COVENANT_ALLOW_PUBLIC_READ !== "false",
  };
}

function createApp() {
  const port = Number(process.env.PORT) || 3000;
  const store = createCovenantStore();
  store.ensureBootData();

  const integrationConfig = loadIntegrationConfig(port);

  const app = express();
  app.use(express.json({ limit: "64kb" }));

  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization,X-Covenant-Key");
    if (req.method === "OPTIONS") {
      return res.sendStatus(204);
    }
    return next();
  });

  app.use(apiAuthMiddleware);
  app.use(createApiRouter(store, integrationConfig));

  return { app, store, integrationConfig, port };
}

module.exports = {
  createApp,
  loadIntegrationConfig,
};

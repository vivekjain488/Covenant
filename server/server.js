require("dotenv").config();

const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;
const keeperHubApiKey = process.env.KEEPERHUB_API_KEY || "";
const uniswapApiKey = process.env.UNISWAP_API_KEY || "";
const zeroGRpcUrl = process.env.ZERO_G_RPC_URL || "";
const zeroGStorageNode = process.env.ZERO_G_STORAGE_NODE || "";
const gensynAxlUrl = process.env.GENSYN_AXL_URL || "http://127.0.0.1:9002";
const guardrailRegistryAddress = process.env.GUARDRAIL_REGISTRY_ADDRESS || "";

app.use(express.json({ limit: "32kb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  return next();
});

const policies = [
  {
    id: "conservative-agent",
    name: "Conservative Agent Policy",
    owner: "0xGuardRailAdmin",
    limitWei: "1000000000000000000",
    windowSeconds: 3600,
    enabled: true,
    tags: ["keeperhub", "0g", "ens"],
  },
  {
    id: "moderate-agent",
    name: "Moderate Agent Policy",
    owner: "0xGuardRailAdmin",
    limitWei: "3000000000000000000",
    windowSeconds: 3600,
    enabled: true,
    tags: ["keeperhub", "uniswap"],
  },
];

const events = [
  {
    type: "ALLOW",
    tone: "emerald",
    time: "12:41:05",
    message: "Conservative agent submitted a treasury rebalance within policy.",
  },
  {
    type: "BLOCK",
    tone: "rose",
    time: "12:41:17",
    message: "Prompt injection pattern detected and denied before execution.",
  },
  {
    type: "LOG",
    tone: "cyan",
    time: "12:41:29",
    message: "Violation appended to 0G storage with sanitized metadata.",
  },
];

function sanitizeText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, 240);
}

function parseAmountWei(value) {
  if (typeof value === "bigint") {
    return value;
  }

  const normalized = typeof value === "string" ? value.trim() : String(value || "0");

  if (!/^\d+$/.test(normalized)) {
    return 0n;
  }

  return BigInt(normalized);
}

function detectRisk(memo) {
  const sanitized = sanitizeText(memo).toLowerCase();
  const patterns = [
    "ignore previous instructions",
    "bypass policy",
    "exfiltrate",
    "override guardrail",
    "unlock admin",
  ];

  return patterns.some((pattern) => sanitized.includes(pattern));
}

function buildDecision(transaction) {
  const policy = policies.find((entry) => entry.id === sanitizeText(transaction.policyId)) || policies[0];
  const amountWei = parseAmountWei(transaction.amountWei);
  const memo = sanitizeText(transaction.memo);

  if (!policy.enabled) {
    return {
      allowed: false,
      reason: "policy-disabled",
      policy,
      amountWei: amountWei.toString(),
    };
  }

  if (detectRisk(memo)) {
    return {
      allowed: false,
      reason: "prompt-injection-detected",
      policy,
      amountWei: amountWei.toString(),
    };
  }

  if (amountWei > BigInt(policy.limitWei)) {
    return {
      allowed: false,
      reason: "limit-exceeded",
      policy,
      amountWei: amountWei.toString(),
    };
  }

  return {
    allowed: true,
    reason: "approved",
    policy,
    amountWei: amountWei.toString(),
  };
}

app.get("/", (_, res) => {
  res.json({
    service: "GuardRail API",
    status: "ok",
    endpoints: ["/health", "/api/state", "/api/policies", "/api/check", "/api/events"],
  });
});

app.get("/health", (_, res) => {
  res.json({ ok: true, service: "guardrail-api", timestamp: new Date().toISOString() });
});

app.get("/api/config", (_, res) => {
  res.json({
    port: PORT,
    integrations: {
      keeperHubConfigured: Boolean(keeperHubApiKey),
      uniswapConfigured: Boolean(uniswapApiKey),
      zeroGConfigured:
        Boolean(zeroGRpcUrl) && Boolean(zeroGStorageNode) && !zeroGStorageNode.startsWith("your_"),
      gensynAxlUrl,
      guardrailRegistryAddress,
    },
  });
});

app.get("/api/state", (_, res) => {
  res.json({
    metrics: {
      policiesEnforced: 128,
      transactionsBlocked: 37,
      auditLogsWritten: 94,
      medianCheckMs: 82,
    },
    policies,
    events,
  });
});

app.get("/api/policies", (_, res) => {
  res.json({ policies });
});

app.post("/api/policies", (req, res) => {
  const name = sanitizeText(req.body?.name);
  const id = sanitizeText(req.body?.id || name.toLowerCase().replace(/\s+/g, "-"));
  const owner = sanitizeText(req.body?.owner || "0xGuardRailAdmin");
  const limitWei = sanitizeText(req.body?.limitWei || "1000000000000000000");
  const windowSeconds = Number.parseInt(req.body?.windowSeconds || 3600, 10);
  const enabled = req.body?.enabled !== false;

  if (!name || !id) {
    return res.status(400).json({ error: "Policy id and name are required." });
  }

  const policy = {
    id,
    name,
    owner,
    limitWei,
    windowSeconds: Number.isFinite(windowSeconds) ? windowSeconds : 3600,
    enabled,
    tags: Array.isArray(req.body?.tags) ? req.body.tags.map(sanitizeText) : [],
  };

  policies.unshift(policy);
  return res.status(201).json({ policy });
});

app.post("/api/check", (req, res) => {
  const decision = buildDecision(req.body || {});
  const logEntry = {
    type: decision.allowed ? "ALLOW" : "BLOCK",
    tone: decision.allowed ? "emerald" : "rose",
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    message: sanitizeText(req.body?.memo || decision.reason || "transaction processed"),
    policyId: decision.policy.id,
    amountWei: decision.amountWei,
  };

  events.unshift(logEntry);
  if (events.length > 20) {
    events.pop();
  }

  return res.json({
    decision,
    logEntry,
  });
});

app.get("/api/events", (_, res) => {
  res.json({ events });
});

app.post("/api/events", (req, res) => {
  const event = {
    type: sanitizeText(req.body?.type || "LOG").toUpperCase().slice(0, 12),
    tone: sanitizeText(req.body?.tone || "cyan").toLowerCase().slice(0, 12),
    time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    message: sanitizeText(req.body?.message || "event recorded"),
  };

  events.unshift(event);
  if (events.length > 20) {
    events.pop();
  }

  res.status(201).json({ event });
});

app.listen(PORT, () => {
  console.log(`GuardRail API running on http://localhost:${PORT}`);
});
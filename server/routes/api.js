const express = require("express");
const { z } = require("zod");
const {
  POLICY_SCHEMA,
  sanitizeText,
  hashPayload,
  buildPolicyFromLegacy,
  compileNaturalLanguagePolicy,
  evaluateCheck,
  computeScore,
} = require("../lib/engine");
const { getScenario } = require("../lib/demo");
const { scheduleAllowedHooks } = require("../lib/integrations");
const { getTopology } = require("../lib/integrations/axl-client");
const { postQuote, probeConnectivity, summarizeQuote, tradingBaseUrl } = require("../lib/integrations/uniswap-trading");
const { isZeroGStorageConfigured } = require("../lib/integrations/zero-g-storage");

const QUOTE_BODY = z.object({
  swapper: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenIn: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenOut: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  tokenInChainId: z.string().max(32),
  tokenOutChainId: z.string().max(32),
  amount: z.string().max(120),
  type: z.enum(["EXACT_INPUT", "EXACT_OUTPUT"]),
  slippageTolerance: z.number().min(0).max(50).optional(),
  routingPreference: z.string().max(64).optional(),
});

function createApiRouter(store, integrationConfig = {}) {
  const {
    readJson,
    writeJson,
    getPolicyList,
    getPoliciesById,
    getDecisions,
    getEvents,
    getThreats,
    persistToViolationFile,
    appendEvent,
    computeState,
    paths,
  } = store;

  const { POLICIES_FILE, DECISIONS_FILE, SCORES_FILE, THREATS_FILE, POLICY_VERSIONS_FILE } = paths;

  const router = express.Router();

  router.get("/", (_, res) => {
    res.json({
      service: "Covenant API",
      status: "ok",
      endpoints: [
        "/health",
        "/api/config",
        "/api/integrations/status",
        "/api/integrations/axl/topology",
        "/api/integrations/uniswap/probe",
        "/api/integrations/uniswap/quote",
        "/api/state",
        "/api/policies",
        "/api/policies/compile",
        "/api/check",
        "/api/events",
        "/api/audit",
        "/api/agents/:id/score",
        "/api/demo/run-scenario",
        "/api/threats",
      ],
    });
  });

  router.get("/health", (_, res) => {
    res.json({ ok: true, service: "covenant-api", timestamp: new Date().toISOString() });
  });

  router.get("/api/config", (_, res) => {
    res.json({
      port: integrationConfig.port,
      auth: {
        apiKeyConfigured: Boolean(integrationConfig.authConfigured),
        publicReadEnabled: integrationConfig.publicReadEnabled !== false,
      },
      integrations: {
        keeperHubConfigured: Boolean(integrationConfig.keeperHubApiKey),
        keeperHubWebhookConfigured: Boolean(integrationConfig.keeperHubWebhookUrl),
        uniswapConfigured: Boolean(integrationConfig.uniswapApiKey),
        uniswapTradingBase: tradingBaseUrl(integrationConfig),
        uniswapNotifyConfigured: Boolean(integrationConfig.uniswapNotifyUrl),
        zeroGConfigured: integrationConfig.zeroGConfigured,
        zeroGStorageReady: integrationConfig.zeroGStorageReady && isZeroGStorageConfigured(integrationConfig),
        zeroGAuditWebhookConfigured: Boolean(integrationConfig.zeroGAuditWebhookUrl),
        gensynAxlUrl: integrationConfig.gensynAxlUrl,
        covenantRegistryAddress: integrationConfig.covenantRegistryAddress,
        persistenceMode: "file-backed",
      },
    });
  });

  router.get("/api/integrations/status", (_, res) => {
    res.json({
      gensynAxlUrl: integrationConfig.gensynAxlUrl,
      uniswapTradingBase: tradingBaseUrl(integrationConfig),
      uniswapApiKeyConfigured: Boolean(integrationConfig.uniswapApiKey),
      zeroGStorageReady: integrationConfig.zeroGStorageReady && isZeroGStorageConfigured(integrationConfig),
    });
  });

  router.get("/api/integrations/axl/topology", async (_, res) => {
    try {
      const topology = await getTopology(integrationConfig.gensynAxlUrl);
      res.json({ ok: true, topology });
    } catch (err) {
      res.status(503).json({
        ok: false,
        error: err.message || "AXL unreachable — start the AXL node or set GENSYN_AXL_URL",
      });
    }
  });

  router.get("/api/integrations/uniswap/probe", async (_, res) => {
    if (!integrationConfig.uniswapApiKey) {
      return res.status(503).json({
        ok: false,
        error: "Set UNISWAP_API_KEY on the server for Trading API access",
      });
    }
    try {
      const result = await probeConnectivity(integrationConfig.uniswapApiKey, integrationConfig);
      return res.json(result);
    } catch (err) {
      return res.status(503).json({
        ok: false,
        error: err.message || "Uniswap Trading API probe failed",
      });
    }
  });

  router.post("/api/integrations/uniswap/quote", async (req, res) => {
    if (!integrationConfig.uniswapApiKey) {
      return res.status(503).json({ error: "UNISWAP_API_KEY not configured" });
    }
    const parsed = QUOTE_BODY.safeParse(req.body || {});
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid quote body",
        issues: typeof parsed.error?.flatten === "function" ? parsed.error.flatten() : parsed.error.message,
      });
    }
    try {
      const full = await postQuote(integrationConfig.uniswapApiKey, parsed.data, integrationConfig);
      return res.json({
        summary: summarizeQuote(full),
        routing: full.routing ?? null,
        quoteFingerprint: full.quote ? "present" : null,
      });
    } catch (error) {
      return res.status(502).json({ error: error.message || "Quote failed" });
    }
  });

  router.get("/api/state", (_, res) => {
    res.json(computeState());
  });

  router.get("/api/policies", (_, res) => {
    res.json({ policies: getPolicyList() });
  });

  router.post("/api/policies", (req, res) => {
    try {
      const policies = getPolicyList();
      const normalized = buildPolicyFromLegacy({
        ...req.body,
        id: sanitizeText(req.body?.id || req.body?.name?.toLowerCase().replace(/\s+/g, "-")),
      });
      const existingIndex = policies.findIndex((policy) => policy.id === normalized.id);

      const nowIso = new Date().toISOString();
      const candidate = POLICY_SCHEMA.parse({
        ...normalized,
        version: existingIndex >= 0 ? (policies[existingIndex].version || 1) + 1 : 1,
        createdAt: existingIndex >= 0 ? policies[existingIndex].createdAt : nowIso,
        updatedAt: nowIso,
      });

      if (existingIndex >= 0) {
        policies[existingIndex] = candidate;
      } else {
        policies.unshift(candidate);
      }
      writeJson(POLICIES_FILE, policies);

      const versions = readJson(POLICY_VERSIONS_FILE, []);
      versions.unshift({
        policyId: candidate.id,
        version: candidate.version,
        timestamp: nowIso,
        policyHash: hashPayload(JSON.stringify(candidate)),
        policy: candidate,
      });
      writeJson(POLICY_VERSIONS_FILE, versions.slice(0, 500));

      const event = appendEvent("POLICY", "cyan", `Policy ${candidate.id} saved at version ${candidate.version}`, {
        policyId: candidate.id,
      });
      return res.status(201).json({ policy: candidate, event });
    } catch (error) {
      return res.status(400).json({ error: error.message || "Invalid policy payload" });
    }
  });

  router.post("/api/policies/compile", (req, res) => {
    try {
      const compiled = compileNaturalLanguagePolicy(req.body || {});
      const policy = compiled.compiledPolicy;
      const policies = getPolicyList();
      const existing = policies.find((entry) => entry.id === policy.id);
      const nowIso = new Date().toISOString();
      const merged = POLICY_SCHEMA.parse({
        ...policy,
        version: existing ? (existing.version || 1) + 1 : 1,
        createdAt: existing ? existing.createdAt : nowIso,
        updatedAt: nowIso,
      });

      const remaining = policies.filter((entry) => entry.id !== merged.id);
      writeJson(POLICIES_FILE, [merged, ...remaining]);

      const versions = readJson(POLICY_VERSIONS_FILE, []);
      versions.unshift({
        policyId: merged.id,
        version: merged.version,
        timestamp: nowIso,
        source: "nl-compiler",
        policyHash: hashPayload(JSON.stringify(merged)),
        policy: merged,
      });
      writeJson(POLICY_VERSIONS_FILE, versions.slice(0, 500));
      appendEvent("COMPILE", "cyan", `Compiled natural-language policy into ${merged.id}`, { policyId: merged.id });

      return res.status(201).json({
        policy: merged,
        explanation: compiled.explanation,
      });
    } catch (error) {
      return res.status(400).json({ error: error.message || "Failed to compile policy text" });
    }
  });

  router.get("/api/policies/:id/versions", (req, res) => {
    const versions = readJson(POLICY_VERSIONS_FILE, []);
    const filtered = versions.filter((entry) => entry.policyId === sanitizeText(req.params.id));
    res.json({ versions: filtered });
  });

  router.post("/api/policies/:id/rollback", (req, res) => {
    const id = sanitizeText(req.params.id);
    const targetVersion = Number.parseInt(req.body?.version, 10);
    const versions = readJson(POLICY_VERSIONS_FILE, []);
    const match = versions.find((entry) => entry.policyId === id && entry.version === targetVersion);
    if (!match) {
      return res.status(404).json({ error: "Requested policy version not found" });
    }

    const prevList = getPolicyList();
    const previousVersion = prevList.find((entry) => entry.id === id)?.version || match.version;
    const policies = prevList.filter((entry) => entry.id !== id);
    const nowIso = new Date().toISOString();
    const rolled = {
      ...match.policy,
      version: previousVersion + 1,
      updatedAt: nowIso,
    };
    policies.unshift(rolled);
    writeJson(POLICIES_FILE, policies);

    versions.unshift({
      policyId: id,
      version: rolled.version,
      timestamp: nowIso,
      source: "rollback",
      policyHash: hashPayload(JSON.stringify(rolled)),
      policy: rolled,
    });
    writeJson(POLICY_VERSIONS_FILE, versions.slice(0, 500));
    appendEvent("ROLLBACK", "amber", `Policy ${id} rolled back using version ${targetVersion}`, { policyId: id });
    return res.json({ policy: rolled });
  });

  router.post("/api/check", (req, res) => {
    const start = Date.now();
    const nowIso = new Date().toISOString();
    const decisions = getDecisions();
    const context = {
      policiesById: getPoliciesById(),
      decisions,
      threats: getThreats(),
    };
    const outcome = evaluateCheck(req.body || {}, context);
    const evalMs = Date.now() - start;

    const scores = readJson(SCORES_FILE, {});
    const previousScore = Number(scores[outcome.payload.agentId] || 500);
    const score = computeScore(previousScore, outcome);
    scores[outcome.payload.agentId] = score;
    writeJson(SCORES_FILE, scores);

    const previousDecision = decisions[decisions.length - 1];
    const prevHash = previousDecision?.entryHash || "";
    const decisionRecord = {
      timestamp: nowIso,
      evalMs,
      allowed: outcome.allowed,
      reason: outcome.reason,
      ruleId: outcome.ruleId,
      requiresChallenge: outcome.requiresChallenge,
      amountWei: outcome.payload.amountWei,
      policyId: outcome.policy?.id || outcome.payload.policyId,
      policyVersion: outcome.policy?.version || 0,
      agentId: outcome.payload.agentId,
      action: outcome.payload.action,
      protocol: outcome.payload.protocol,
      pair: outcome.payload.pair,
      destination: outcome.payload.destination,
      message: sanitizeText(outcome.payload.memo, 300),
      remainingBudget: outcome.remainingBudget || "0",
      scoreBefore: previousScore,
      scoreAfter: score,
      prevHash,
    };
    decisionRecord.entryHash = hashPayload(JSON.stringify(decisionRecord));
    store.appendJsonl(DECISIONS_FILE, decisionRecord);

    const event = appendEvent(
      outcome.allowed ? "ALLOW" : "BLOCK",
      outcome.allowed ? "emerald" : "rose",
      `${outcome.payload.agentId} ${outcome.allowed ? "approved" : "blocked"}: ${outcome.reason}`,
      {
        policyId: decisionRecord.policyId,
        amountWei: decisionRecord.amountWei,
        ruleId: decisionRecord.ruleId,
        agentId: decisionRecord.agentId,
      },
    );
    if (!outcome.allowed) {
      persistToViolationFile(event);
    }

    if (outcome.allowed) {
      scheduleAllowedHooks(integrationConfig, { decisionRecord, outcome });
    }

    return res.json({
      decision: {
        allowed: outcome.allowed,
        reason: outcome.reason,
        ruleId: outcome.ruleId,
        requiresChallenge: outcome.requiresChallenge,
        policy: outcome.policy,
        amountWei: outcome.payload.amountWei,
        remainingBudget: decisionRecord.remainingBudget,
        scoreAfter: score,
        decisionHash: decisionRecord.entryHash,
        prevHash,
      },
      logEntry: event,
    });
  });

  router.get("/api/events", (_, res) => {
    res.json({ events: getEvents().slice(0, 40) });
  });

  router.post("/api/events", (req, res) => {
    const event = appendEvent(
      sanitizeText(req.body?.type || "LOG", 12).toUpperCase(),
      sanitizeText(req.body?.tone || "cyan", 12).toLowerCase(),
      sanitizeText(req.body?.message || "event recorded", 280),
      {
        policyId: sanitizeText(req.body?.policyId || ""),
        agentId: sanitizeText(req.body?.agentId || ""),
        amountWei: sanitizeText(req.body?.amountWei || ""),
      },
    );
    persistToViolationFile(event);
    res.status(201).json({ event });
  });

  router.get("/api/audit", (req, res) => {
    const agent = sanitizeText(req.query.agent || "", 120);
    const from = req.query.from ? new Date(String(req.query.from)).getTime() : null;
    const to = req.query.to ? new Date(String(req.query.to)).getTime() : null;

    const filtered = getDecisions()
      .filter((entry) => (agent ? entry.agentId === agent : true))
      .filter((entry) => {
        const time = new Date(entry.timestamp).getTime();
        if (from && time < from) return false;
        if (to && time > to) return false;
        return true;
      })
      .slice(-400)
      .reverse();
    res.json({ decisions: filtered });
  });

  router.get("/api/agents/:id/score", (req, res) => {
    const scores = readJson(SCORES_FILE, {});
    const agentId = sanitizeText(req.params.id, 120);
    const currentScore = Number(scores[agentId] || 500);
    const history = getDecisions().filter((entry) => entry.agentId === agentId).slice(-50);
    res.json({
      agentId,
      score: currentScore,
      checks: history.length,
      blocked: history.filter((entry) => !entry.allowed).length,
      lastUpdated: history.at(-1)?.timestamp || null,
    });
  });

  router.get("/api/threats", (_, res) => {
    res.json({ threats: getThreats() });
  });

  router.post("/api/threats", (req, res) => {
    const threats = getThreats();
    const threat = {
      id: `threat-${Date.now()}`,
      pattern: sanitizeText(req.body?.pattern, 160),
      source: sanitizeText(req.body?.source || "community", 80),
      confidence: Math.max(0, Math.min(1, Number(req.body?.confidence || 0.7))),
      enabled: req.body?.enabled !== false,
      createdAt: new Date().toISOString(),
    };
    if (!threat.pattern) {
      return res.status(400).json({ error: "pattern is required" });
    }
    threats.unshift(threat);
    writeJson(THREATS_FILE, threats.slice(0, 1000));
    appendEvent("THREAT", "amber", `Threat signature added: ${threat.pattern.slice(0, 50)}`, { threatId: threat.id });
    return res.status(201).json({ threat });
  });

  router.post("/api/demo/run-scenario", (req, res) => {
    const scenarioName = sanitizeText(req.body?.name || "attackReplay", 80);
    const payloads = getScenario(scenarioName);
    const results = [];

    payloads.forEach((payload) => {
      const context = {
        policiesById: getPoliciesById(),
        decisions: getDecisions(),
        threats: getThreats(),
      };
      const decision = evaluateCheck(payload, context);
      const scores = readJson(SCORES_FILE, {});
      const previousScore = Number(scores[payload.agentId] || 500);
      const score = computeScore(previousScore, decision);
      scores[payload.agentId] = score;
      writeJson(SCORES_FILE, scores);

      const existing = getDecisions();
      const prevHash = existing[existing.length - 1]?.entryHash || "";
      const record = {
        timestamp: new Date().toISOString(),
        evalMs: 1,
        allowed: decision.allowed,
        reason: decision.reason,
        ruleId: decision.ruleId,
        requiresChallenge: decision.requiresChallenge,
        amountWei: payload.amountWei,
        policyId: decision.policy?.id || payload.policyId,
        policyVersion: decision.policy?.version || 0,
        agentId: payload.agentId,
        action: payload.action,
        protocol: payload.protocol,
        pair: payload.pair,
        destination: payload.destination,
        message: sanitizeText(payload.memo),
        remainingBudget: decision.remainingBudget || "0",
        scoreBefore: previousScore,
        scoreAfter: score,
        prevHash,
      };
      record.entryHash = hashPayload(JSON.stringify(record));
      store.appendJsonl(DECISIONS_FILE, record);
      appendEvent(decision.allowed ? "ALLOW" : "BLOCK", decision.allowed ? "emerald" : "rose", `${payload.agentId} ${decision.allowed ? "approved" : "blocked"} during ${scenarioName}`, {
        policyId: record.policyId,
        amountWei: record.amountWei,
        ruleId: record.ruleId,
        agentId: record.agentId,
      });
      if (!decision.allowed) {
        persistToViolationFile(record);
      }
      results.push({
        ...decision,
        policy: decision.policy ? { id: decision.policy.id, name: decision.policy.name } : null,
        scoreAfter: score,
        decisionHash: record.entryHash,
      });
    });

    return res.json({ scenario: scenarioName, runs: results.length, results });
  });

  return router;
}

module.exports = {
  createApiRouter,
};

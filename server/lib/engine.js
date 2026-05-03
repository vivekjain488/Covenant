const crypto = require("crypto");
const { z } = require("zod");

const POLICY_SCHEMA = z.object({
  id: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().min(2).max(120),
  owner: z.string().min(2).max(120),
  enabled: z.boolean().default(true),
  tags: z.array(z.string().min(1).max(32)).default([]),
  parentId: z.string().optional(),
  version: z.number().int().positive().default(1),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
  constraints: z.object({
    spendLimitWei: z.string().regex(/^\d+$/),
    windowSeconds: z.number().int().min(60).max(86_400),
    allowedActions: z.array(z.string().min(1)).default(["swap", "transfer"]),
    allowedProtocols: z.array(z.string().min(1)).default([]),
    allowedPairs: z.array(z.string().min(1)).default([]),
    denyNewAddresses: z.boolean().default(false),
    denyFreshContractsDays: z.number().int().min(0).max(365).default(0),
    activeHoursUtc: z
      .object({
        start: z.number().int().min(0).max(23),
        end: z.number().int().min(0).max(23),
      })
      .nullable()
      .default(null),
    challengeThresholdWei: z.string().regex(/^\d+$/).default("0"),
  }),
});

const CHECK_SCHEMA = z.object({
  agentId: z.string().min(2).max(120).default("default-agent"),
  policyId: z.string().min(2).max(80),
  amountWei: z.string().regex(/^\d+$/),
  action: z.string().min(2).max(64).default("swap"),
  protocol: z.string().min(2).max(64).default("uniswap"),
  pair: z.string().min(2).max(64).default("ETH/USDC"),
  destination: z.string().min(2).max(160).default("unknown"),
  destinationCreatedAt: z.string().datetime().optional(),
  memo: z.string().max(400).default(""),
  challengeResponse: z.string().max(200).optional(),
  timestamp: z.string().datetime().optional(),
});

const COMPILER_INPUT_SCHEMA = z.object({
  policyText: z.string().min(10).max(2000),
  defaultPolicyId: z.string().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  owner: z.string().min(2).max(120).default("0xCovenantAdmin"),
});

function sanitizeText(value, max = 240) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .trim()
    .slice(0, max);
}

function parseAmountWei(value) {
  const raw = String(value ?? "0").trim();
  if (!/^\d+$/.test(raw)) {
    return 0n;
  }
  return BigInt(raw);
}

function hashPayload(payload) {
  return crypto.createHash("sha256").update(payload).digest("hex");
}

function detectPromptInjection(memo) {
  const normalized = sanitizeText(memo, 600).toLowerCase();
  const patterns = [
    "ignore previous instructions",
    "bypass policy",
    "override guardrail",
    "override covenant",
    "exfiltrate",
    "unlock admin",
  ];
  return patterns.some((pattern) => normalized.includes(pattern));
}

function isOutsideActiveWindow(activeHoursUtc, nowDate) {
  if (!activeHoursUtc) {
    return false;
  }
  const hour = nowDate.getUTCHours();
  const { start, end } = activeHoursUtc;
  if (start === end) {
    return false;
  }
  if (start < end) {
    return hour < start || hour >= end;
  }
  return hour < start && hour >= end;
}

function buildPolicyFromLegacy(input) {
  const parsedWindow = Number.parseInt(input.windowSeconds || 3600, 10);
  return {
    id: sanitizeText(input.id).toLowerCase().replace(/\s+/g, "-"),
    name: sanitizeText(input.name, 120),
    owner: sanitizeText(input.owner || "0xCovenantAdmin", 120),
    enabled: input.enabled !== false,
    tags: Array.isArray(input.tags) ? input.tags.map((tag) => sanitizeText(tag, 32)).filter(Boolean) : [],
    parentId: input.parentId ? sanitizeText(input.parentId) : undefined,
    constraints: {
      spendLimitWei: sanitizeText(input.limitWei || "0", 120),
      windowSeconds: Number.isFinite(parsedWindow) ? parsedWindow : 3600,
      allowedActions: Array.isArray(input.allowedActions) && input.allowedActions.length > 0 ? input.allowedActions : ["swap", "transfer"],
      allowedProtocols: Array.isArray(input.allowedProtocols) ? input.allowedProtocols : [],
      allowedPairs: Array.isArray(input.allowedPairs) ? input.allowedPairs : [],
      denyNewAddresses: Boolean(input.denyNewAddresses),
      denyFreshContractsDays: Number.parseInt(input.denyFreshContractsDays || 0, 10) || 0,
      activeHoursUtc: input.activeHoursUtc ?? null,
      challengeThresholdWei: sanitizeText(input.challengeThresholdWei || "0"),
    },
  };
}

function compileNaturalLanguagePolicy(input) {
  const parsed = COMPILER_INPUT_SCHEMA.parse(input);
  const text = parsed.policyText.toLowerCase();

  const spendMatch = text.match(/(\d+(?:\.\d+)?)\s*(eth|usd)/);
  const dayMatch = text.match(/(\d+)\s*\/\s*day|per day|daily/);
  const pairMatch = text.match(/([a-z]{2,10})\s*\/\s*([a-z]{2,10})/);
  const hoursMatch = text.match(/between\s+(\d{1,2})(?:am|pm)?\s*-\s*(\d{1,2})(?:am|pm)?\s*utc/);
  const protocolMatch = text.match(/on\s+(uniswap|aave|curve|1inch|cow)/);
  const challengeMatch = text.includes("explain") || text.includes("challenge");

  let spendLimitWei = "1000000000000000000";
  if (spendMatch) {
    const amount = Number.parseFloat(spendMatch[1]);
    const unit = spendMatch[2];
    if (Number.isFinite(amount) && amount > 0) {
      if (unit === "eth") {
        spendLimitWei = BigInt(Math.round(amount * 1e6)) * 10n ** 12n + "";
      } else {
        // Approximate: 1 ETH = 2500 USD for default compile-only estimate
        const ethAmount = amount / 2500;
        spendLimitWei = BigInt(Math.max(1, Math.round(ethAmount * 1e6))) * 10n ** 12n + "";
      }
    }
  }

  const windowSeconds = dayMatch ? 86_400 : 3600;
  const allowedProtocols = protocolMatch ? [protocolMatch[1]] : [];
  const allowedPairs = pairMatch ? [`${pairMatch[1].toUpperCase()}/${pairMatch[2].toUpperCase()}`] : [];
  const activeHoursUtc =
    hoursMatch && Number.isFinite(Number(hoursMatch[1])) && Number.isFinite(Number(hoursMatch[2]))
      ? { start: Number(hoursMatch[1]) % 24, end: Number(hoursMatch[2]) % 24 }
      : null;

  const policyId = parsed.defaultPolicyId || `compiled-${Date.now()}`;
  const compiledPolicy = POLICY_SCHEMA.parse({
    id: policyId,
    name: `Compiled Policy ${policyId}`,
    owner: parsed.owner,
    enabled: true,
    tags: ["compiled", "nl"],
    constraints: {
      spendLimitWei,
      windowSeconds,
      allowedActions: ["swap", "transfer"],
      allowedProtocols,
      allowedPairs,
      denyNewAddresses: text.includes("new address"),
      denyFreshContractsDays: text.includes("30 days") ? 30 : 0,
      activeHoursUtc,
      challengeThresholdWei: challengeMatch ? "100000000000000000" : "0",
    },
  });

  return {
    compiledPolicy,
    explanation: {
      inputSummary: sanitizeText(parsed.policyText, 400),
      extracted: {
        spendLimitWei,
        windowSeconds,
        allowedProtocols,
        allowedPairs,
        activeHoursUtc,
      },
      note: "Compiler uses deterministic parsing rules with conservative defaults when intent is ambiguous.",
    },
  };
}

function resolvePolicy(policiesById, policyId) {
  let current = policiesById[policyId];
  if (!current) {
    return null;
  }

  let depth = 0;
  let resolved = JSON.parse(JSON.stringify(current));
  while (resolved.parentId && depth < 8) {
    const parent = policiesById[resolved.parentId];
    if (!parent) {
      break;
    }
    resolved = {
      ...parent,
      ...resolved,
      constraints: {
        ...parent.constraints,
        ...resolved.constraints,
      },
    };
    depth += 1;
  }
  return resolved;
}

function evaluateCheck(input, context) {
  const payload = CHECK_SCHEMA.parse(input);
  const now = payload.timestamp ? new Date(payload.timestamp) : new Date();
  const policy = resolvePolicy(context.policiesById, payload.policyId);

  if (!policy) {
    return { allowed: false, reason: "policy-not-found", ruleId: "P0", requiresChallenge: false, policy: null, payload };
  }
  if (!policy.enabled) {
    return { allowed: false, reason: "policy-disabled", ruleId: "P1", requiresChallenge: false, policy, payload };
  }

  const amountWei = parseAmountWei(payload.amountWei);
  const spendLimit = parseAmountWei(policy.constraints.spendLimitWei);
  const windowSeconds = policy.constraints.windowSeconds;

  const recentForPolicy = context.decisions.filter(
    (entry) =>
      entry.policyId === policy.id &&
      entry.allowed &&
      now.getTime() - new Date(entry.timestamp).getTime() <= windowSeconds * 1000,
  );
  const spentInWindow = recentForPolicy.reduce((sum, entry) => sum + parseAmountWei(entry.amountWei), 0n);
  const remainingBudget = spentInWindow >= spendLimit ? 0n : spendLimit - spentInWindow;
  const recentTenMinuteSpend = context.decisions
    .filter(
      (entry) =>
        entry.policyId === policy.id &&
        entry.allowed &&
        now.getTime() - new Date(entry.timestamp).getTime() <= 10 * 60 * 1000,
    )
    .reduce((sum, entry) => sum + parseAmountWei(entry.amountWei), 0n);

  const isInjection = detectPromptInjection(payload.memo);
  if (isInjection) {
    return { allowed: false, reason: "prompt-injection-detected", ruleId: "R1", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  if (!policy.constraints.allowedActions.includes(payload.action)) {
    return { allowed: false, reason: "action-not-allowed", ruleId: "R2", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  if (policy.constraints.allowedProtocols.length > 0 && !policy.constraints.allowedProtocols.includes(payload.protocol)) {
    return { allowed: false, reason: "protocol-not-allowed", ruleId: "R3", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  if (policy.constraints.allowedPairs.length > 0 && !policy.constraints.allowedPairs.includes(payload.pair)) {
    return { allowed: false, reason: "pair-not-allowed", ruleId: "R4", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  if (isOutsideActiveWindow(policy.constraints.activeHoursUtc, now)) {
    return { allowed: false, reason: "outside-time-window", ruleId: "R5", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  if (policy.constraints.denyFreshContractsDays > 0 && payload.destinationCreatedAt) {
    const ageMs = now.getTime() - new Date(payload.destinationCreatedAt).getTime();
    const minAgeMs = policy.constraints.denyFreshContractsDays * 24 * 60 * 60 * 1000;
    if (ageMs < minAgeMs) {
      return { allowed: false, reason: "fresh-contract-blocked", ruleId: "R6", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
    }
  }

  const threatMatch = context.threats.find((threat) => threat.enabled && threat.pattern && payload.memo.toLowerCase().includes(threat.pattern.toLowerCase()));
  if (threatMatch) {
    return { allowed: false, reason: "threat-intel-match", ruleId: "R7", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  const recentRejected = context.decisions
    .filter((entry) => entry.agentId === payload.agentId && !entry.allowed && now.getTime() - new Date(entry.timestamp).getTime() <= 60 * 60 * 1000)
    .length;
  if (recentRejected >= 3) {
    return { allowed: false, reason: "circuit-breaker-repeated-rejects", ruleId: "C1", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  if (spendLimit > 0n && recentTenMinuteSpend * 100n >= spendLimit * 80n) {
    return { allowed: false, reason: "circuit-breaker-spend-velocity", ruleId: "C2", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  if (amountWei > remainingBudget) {
    return { allowed: false, reason: "limit-exceeded", ruleId: "R8", requiresChallenge: false, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  const challengeThreshold = parseAmountWei(policy.constraints.challengeThresholdWei);
  const requiresChallenge = challengeThreshold > 0n && amountWei >= challengeThreshold;
  if (requiresChallenge && !sanitizeText(payload.challengeResponse, 200)) {
    return { allowed: false, reason: "challenge-required", ruleId: "R9", requiresChallenge: true, policy, payload, remainingBudget: remainingBudget.toString() };
  }

  return {
    allowed: true,
    reason: "approved",
    ruleId: "ALLOW",
    requiresChallenge,
    policy,
    payload,
    remainingBudget: (remainingBudget - amountWei).toString(),
  };
}

function computeScore(previousScore, decision) {
  let next = Number.isFinite(previousScore) ? previousScore : 500;
  if (decision.allowed) {
    next += 6;
  } else if (decision.reason === "challenge-required") {
    next -= 3;
  } else {
    next -= 14;
  }

  if (decision.reason === "prompt-injection-detected" || decision.reason === "threat-intel-match") {
    next -= 18;
  }
  return Math.min(1000, Math.max(0, next));
}

module.exports = {
  POLICY_SCHEMA,
  CHECK_SCHEMA,
  COMPILER_INPUT_SCHEMA,
  sanitizeText,
  parseAmountWei,
  hashPayload,
  detectPromptInjection,
  buildPolicyFromLegacy,
  compileNaturalLanguagePolicy,
  evaluateCheck,
  computeScore,
};

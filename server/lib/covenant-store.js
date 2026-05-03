const fs = require("fs");
const path = require("path");
const {
  DATA_DIR,
  ensureDir,
  ensureJson,
  ensureJsonl,
  readJson,
  writeJson,
  appendJsonl,
  readJsonl,
} = require("./storage");
const { sanitizeText, hashPayload } = require("./engine");

const VIOLATIONS_FILE = path.join(__dirname, "..", "violations.json");
const DEFAULT_POLICY_SEED = path.join(__dirname, "..", "config", "default-policies.seed.json");

function loadDefaultPolicies() {
  const seedPath = process.env.COVENANT_DEFAULT_POLICIES_PATH
    ? path.resolve(process.cwd(), process.env.COVENANT_DEFAULT_POLICIES_PATH)
    : DEFAULT_POLICY_SEED;

  const raw = fs.readFileSync(seedPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Covenant policy seed JSON must be a top-level array");
  }

  const now = new Date().toISOString();
  return parsed.map((policy) => ({
    ...policy,
    createdAt: now,
    updatedAt: now,
  }));
}

function createCovenantStore() {
  const POLICIES_FILE = path.join(DATA_DIR, "policies.json");
  const EVENTS_FILE = path.join(DATA_DIR, "events.jsonl");
  const DECISIONS_FILE = path.join(DATA_DIR, "decisions.jsonl");
  const SCORES_FILE = path.join(DATA_DIR, "scores.json");
  const THREATS_FILE = path.join(DATA_DIR, "threats.json");
  const POLICY_VERSIONS_FILE = path.join(DATA_DIR, "policy-versions.json");

  function ensureBootData() {
    ensureDir(DATA_DIR);
    ensureJson(POLICIES_FILE, loadDefaultPolicies());
    ensureJson(SCORES_FILE, {});
    ensureJson(THREATS_FILE, []);
    ensureJson(POLICY_VERSIONS_FILE, []);
    ensureJson(VIOLATIONS_FILE, []);
    ensureJsonl(EVENTS_FILE);
    ensureJsonl(DECISIONS_FILE);
  }

  function getPolicyList() {
    return readJson(POLICIES_FILE, []);
  }

  function getPoliciesById() {
    return getPolicyList().reduce((acc, item) => {
      acc[item.id] = item;
      return acc;
    }, {});
  }

  function getDecisions() {
    return readJsonl(DECISIONS_FILE);
  }

  function getEvents() {
    const events = readJsonl(EVENTS_FILE);
    return events.slice(-60).reverse();
  }

  function getThreats() {
    return readJson(THREATS_FILE, []);
  }

  function persistToViolationFile(logEntry) {
    const logs = readJson(VIOLATIONS_FILE, []);
    logs.unshift(logEntry);
    writeJson(VIOLATIONS_FILE, logs.slice(0, 500));
  }

  function appendEvent(type, tone, message, extra = {}) {
    const event = {
      type,
      tone,
      message: sanitizeText(message, 280),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      timestamp: new Date().toISOString(),
      ...extra,
    };
    appendJsonl(EVENTS_FILE, event);
    return event;
  }

  function computeState() {
    const decisions = getDecisions();
    const policies = getPolicyList();
    const events = getEvents();

    const blocked = decisions.filter((entry) => !entry.allowed).length;
    const checks = decisions.length;
    const auditLogsWritten = decisions.length + events.length;
    const recentDurations = decisions.slice(-200).map((entry) => Number(entry.evalMs || 0)).filter((value) => Number.isFinite(value) && value > 0);
    const medianCheckMs =
      recentDurations.length === 0
        ? 0
        : recentDurations.sort((a, b) => a - b)[Math.floor(recentDurations.length / 2)];

    return {
      metrics: {
        policiesEnforced: policies.length,
        totalChecks: checks,
        transactionsBlocked: blocked,
        auditLogsWritten,
        medianCheckMs,
      },
      policies,
      events: events.slice(0, 20),
    };
  }

  return {
    paths: { POLICIES_FILE, EVENTS_FILE, DECISIONS_FILE, SCORES_FILE, THREATS_FILE, POLICY_VERSIONS_FILE, VIOLATIONS_FILE },
    ensureBootData,
    getPolicyList,
    getPoliciesById,
    getDecisions,
    getEvents,
    getThreats,
    readJson,
    writeJson,
    appendJsonl,
    persistToViolationFile,
    appendEvent,
    computeState,
    hashPayload,
  };
}

module.exports = {
  createCovenantStore,
  VIOLATIONS_FILE,
};

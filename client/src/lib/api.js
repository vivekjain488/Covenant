/** API origin: `.env.development` / Dockerfile ARG / `.env.production` — never hardcoded here */
const rawBase = import.meta.env.VITE_API_URL;
const API_BASE = rawBase === undefined || rawBase === null ? "" : rawBase;

const BROWSER_API_KEY = import.meta.env.VITE_COVENANT_API_KEY || "";

function joinUrl(path) {
  if (API_BASE === "") {
    return path;
  }
  const base = String(API_BASE).replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

function withAuthHeaders(headers = {}) {
  const next = { ...headers };
  if (BROWSER_API_KEY && !next.Authorization && !next["X-Covenant-Key"]) {
    next.Authorization = `Bearer ${BROWSER_API_KEY}`;
  }
  return next;
}

async function request(path, options = {}) {
  const { headers: optionHeaders, ...rest } = options;
  const headers = withAuthHeaders({
    "Content-Type": "application/json",
    ...optionHeaders,
  });
  const res = await fetch(joinUrl(path), { ...rest, headers });
  if (!res.ok) {
    let message = "Request failed";
    try {
      const data = await res.json();
      message = data.error || message;
    } catch {
      // Keep default message when response is not JSON.
    }
    throw new Error(message);
  }
  return res.json();
}

export async function fetchState() {
  return request("/api/state");
}

export async function fetchPolicies() {
  return request("/api/policies");
}

export async function createPolicy(policy) {
  return request("/api/policies", {
    method: "POST",
    body: JSON.stringify(policy),
  });
}

export async function checkTransaction(transaction) {
  return request("/api/check", {
    method: "POST",
    body: JSON.stringify(transaction),
  });
}

export async function fetchEvents() {
  return request("/api/events");
}

export async function fetchApiConfig() {
  return request("/api/config");
}

export async function getApiConfig() {
  return fetchApiConfig();
}

export async function fetchAudit(params = {}) {
  const query = new URLSearchParams();
  if (params.agent) query.set("agent", params.agent);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request(`/api/audit${suffix}`);
}

export async function fetchAgentScore(agentId) {
  return request(`/api/agents/${encodeURIComponent(agentId)}/score`);
}

export async function compilePolicy(policyText, owner = "0xCovenantAdmin", defaultPolicyId) {
  return request("/api/policies/compile", {
    method: "POST",
    body: JSON.stringify({ policyText, owner, defaultPolicyId }),
  });
}

export async function runDemoScenario(name = "attackReplay") {
  return request("/api/demo/run-scenario", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function fetchThreats() {
  return request("/api/threats");
}

export async function addThreat(pattern, source = "community", confidence = 0.7) {
  return request("/api/threats", {
    method: "POST",
    body: JSON.stringify({ pattern, source, confidence }),
  });
}

export async function fetchPolicyVersions(policyId) {
  return request(`/api/policies/${encodeURIComponent(policyId)}/versions`);
}

export async function rollbackPolicy(policyId, version) {
  return request(`/api/policies/${encodeURIComponent(policyId)}/rollback`, {
    method: "POST",
    body: JSON.stringify({ version }),
  });
}

export function getApiBaseUrl() {
  return API_BASE;
}

/** AXL HTTP base for UI labels — prefer `/api/config`, then optional VITE_* (see ENVIRONMENT.md). */
export function getAxlDisplayUrl(apiConfig = null) {
  return (
    apiConfig?.integrations?.gensynAxlUrl?.trim?.() ||
    import.meta.env.VITE_GENSYN_AXL_URL ||
    import.meta.env.VITE_AXL_URL ||
    ""
  );
}

export async function getAxlTopology() {
  const data = await request("/api/integrations/axl/topology");
  if (!data?.ok || !data.topology) {
    throw new Error(data?.error || "AXL topology unavailable");
  }
  return data.topology;
}

export async function getIntegrationsStatus() {
  return request("/api/integrations/status");
}

/** Does not throw on 503 — used by Integrations so red/green reflects `{ ok }` plus error text. */
export async function probeUniswapTrading() {
  const res = await fetch(joinUrl("/api/integrations/uniswap/probe"), {
    headers: withAuthHeaders({ "Content-Type": "application/json" }),
  });
  const data = await res.json().catch(() => ({}));
  return {
    ok: Boolean(data?.ok),
    error: typeof data?.error === "string" ? data.error : undefined,
    summary: data?.summary ?? null,
  };
}

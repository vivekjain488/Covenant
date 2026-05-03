/**
 * Gensyn AXL local HTTP bridge (no separate npm SDK — REST per AXL docs).
 * @see https://github.com/gensyn-ai/axl/blob/main/docs/api.md
 */

function normalizeBase(url) {
  const base = String(url || "").trim().replace(/\/+$/, "");
  if (!base) {
    throw new Error("GENSYN_AXL_URL is not set on the Covenant server");
  }
  return base;
}

function localTopologyHint(base) {
  const isLocal =
    /127\.0\.0\.1|localhost|^::1$/i.test(base) || base.includes("[::1]");
  if (!isLocal) {
    return " Confirm GENSYN_AXL_URL is reachable from the Covenant server (not only from your laptop).";
  }
  return (
    " On this machine: clone https://github.com/gensyn-ai/axl → `make build` → `./node -config node-config.json` " +
      "(needs Go 1.25.5+). Then test: `curl -s http://127.0.0.1:9002/topology`."
  );
}

function explainFetchFailure(netErr, base) {
  const cause = netErr?.cause;
  const code =
    typeof cause === "object" && cause !== null ? cause.code : undefined;
  if (netErr?.name === "AbortError") {
    return `AXL topology request timed out (>${8000 / 1000}s).`;
  }
  if (code === "ECONNREFUSED" || code === "ENOTFOUND") {
    const verb = code === "ECONNREFUSED" ? "Connection refused —" : "Host not found —";
    return `${verb} Covenant cannot reach ${base}.${localTopologyHint(base)}`;
  }
  const generic = typeof netErr?.message === "string" ? netErr.message : "Network error";
  if (/fetch failed/i.test(generic)) {
    return `Cannot reach AXL at ${base}.${localTopologyHint(base)} (underlying: ${code || generic})`;
  }
  return `${generic}${generic.endsWith(".") ? "" : "."}${localTopologyHint(base)}`;
}

/**
 * GET /topology — node identity & peers (AXL exposes this locally).
 */
async function getTopology(axlBaseUrl, { timeoutMs = 8000 } = {}) {
  const base = normalizeBase(axlBaseUrl);
  let res;
  try {
    res = await fetch(`${base}/topology`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (netErr) {
    throw new Error(explainFetchFailure(netErr, base));
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`AXL topology HTTP ${res.status}: ${text.slice(0, 160)}`);
  }
  return res.json();
}

module.exports = {
  normalizeBase,
  getTopology,
};

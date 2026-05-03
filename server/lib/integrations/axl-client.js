/**
 * Gensyn AXL local HTTP bridge (no separate npm SDK — REST per AXL docs).
 * @see https://github.com/gensyn-ai/axl
 */

function normalizeBase(url) {
  const base = String(url || "").trim().replace(/\/+$/, "");
  if (!base) {
    throw new Error("GENSYN_AXL_URL is not set on the Covenant server");
  }
  return base;
}

/**
 * GET /topology — node identity & peers (AXL exposes this locally).
 */
async function getTopology(axlBaseUrl, { timeoutMs = 8000 } = {}) {
  const base = normalizeBase(axlBaseUrl);
  const res = await fetch(`${base}/topology`, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
  });
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

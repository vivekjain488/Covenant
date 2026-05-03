/**
 * Optional API protection via COVENANT_API_KEY.
 * When unset or empty, all routes stay open (local development).
 *
 * With COVENANT_ALLOW_PUBLIC_READ=true (default when a key is set),
 * GET requests to dashboard-safe paths work without a key; all mutations require the key.
 * Set COVENANT_ALLOW_PUBLIC_READ=false to require the key for every request except / and /health.
 */

function extractProvidedKey(req) {
  const auth = req.headers.authorization || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const headerKey = req.headers["x-covenant-key"];
  const combined = bearer || (typeof headerKey === "string" ? headerKey : "");
  return combined;
}

function isPublicReadGet(req) {
  if (req.method !== "GET") {
    return false;
  }
  const p = req.path || "";

  if (
    p === "/api/state" ||
    p === "/api/config" ||
    p === "/api/integrations/status" ||
    p === "/api/integrations/axl/topology" ||
    p === "/api/integrations/uniswap/probe" ||
    p === "/api/events" ||
    p === "/api/policies" ||
    p === "/api/audit" ||
    p === "/api/threats"
  ) {
    return true;
  }

  if (p.startsWith("/api/policies/") && p.endsWith("/versions")) {
    return true;
  }

  if (/^\/api\/agents\/[^/]+\/score$/.test(p)) {
    return true;
  }

  return false;
}

function apiAuthMiddleware(req, res, next) {
  const expected = process.env.COVENANT_API_KEY;
  if (!expected || String(expected).trim() === "") {
    return next();
  }

  if (req.method === "OPTIONS") {
    return next();
  }

  const p = req.path || "";

  if (p === "/" || p === "/health") {
    return next();
  }

  const publicReadEnabled = process.env.COVENANT_ALLOW_PUBLIC_READ !== "false";
  if (publicReadEnabled && isPublicReadGet(req)) {
    return next();
  }

  const got = extractProvidedKey(req);
  if (got !== expected) {
    return res.status(401).json({
      error: "Unauthorized",
      hint: "Send Authorization: Bearer <token> or header X-Covenant-Key matching COVENANT_API_KEY",
    });
  }

  return next();
}

module.exports = {
  apiAuthMiddleware,
  extractProvidedKey,
};

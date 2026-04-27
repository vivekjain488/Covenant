const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const AXL_BASE_URL = import.meta.env.VITE_GENSYN_AXL_URL || "http://127.0.0.1:9002";

async function fetchJson(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }

    return await response.json();
  } finally {
    window.clearTimeout(timer);
  }
}

export function getApiBaseUrl() {
  return API_BASE_URL;
}

export function getAxlBaseUrl() {
  return AXL_BASE_URL;
}

export async function getApiState() {
  return fetchJson(`${API_BASE_URL}/api/state`);
}

export async function getApiConfig() {
  return fetchJson(`${API_BASE_URL}/api/config`);
}

export async function createPolicy(policy) {
  return fetchJson(`${API_BASE_URL}/api/policies`, {
    method: "POST",
    body: JSON.stringify(policy),
  });
}

export async function runPolicyCheck(payload) {
  return fetchJson(`${API_BASE_URL}/api/check`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getAxlTopology() {
  return fetchJson(`${AXL_BASE_URL}/topology`);
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export async function fetchState() {
  const res = await fetch(`${API_BASE}/api/state`);
  if (!res.ok) throw new Error("Failed to fetch state");
  return res.json();
}

export async function fetchPolicies() {
  const res = await fetch(`${API_BASE}/api/policies`);
  if (!res.ok) throw new Error("Failed to fetch policies");
  return res.json();
}

export async function createPolicy(policy) {
  const res = await fetch(`${API_BASE}/api/policies`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(policy),
  });
  if (!res.ok) throw new Error("Failed to create policy");
  return res.json();
}

export async function checkTransaction(transaction) {
  const res = await fetch(`${API_BASE}/api/check`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(transaction),
  });
  if (!res.ok) throw new Error("Failed to check transaction");
  return res.json();
}

export async function fetchEvents() {
  const res = await fetch(`${API_BASE}/api/events`);
  if (!res.ok) throw new Error("Failed to fetch events");
  return res.json();
}

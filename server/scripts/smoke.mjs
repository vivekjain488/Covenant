#!/usr/bin/env node
/**
 * Starts server.js on an ephemeral PORT, verifies key endpoints, then exits.
 * Use: node scripts/smoke.mjs (from server/) or npm run smoke (from server/)
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const serverDir = join(__dirname, "..");
const PORT = String(Number(process.env.SMOKE_PORT) || 31000 + Math.floor(Math.random() * 900));

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitReady(base) {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`${base}/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await delay(150);
  }
  throw new Error("Server failed to respond on /health in time");
}

async function main() {
  // Force open API for smoke: user .env may set COVENANT_API_KEY; dotenv does not override existing env.
  const env = {
    ...process.env,
    PORT,
    COVENANT_API_KEY: "",
    COVENANT_ALLOW_PUBLIC_READ: "true",
  };
  const child = spawn(process.execPath, ["server.js"], {
    cwd: serverDir,
    env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let logs = "";
  child.stdout?.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr?.on("data", (chunk) => {
    logs += chunk.toString();
  });

  const base = `http://127.0.0.1:${PORT}`;

  try {
    await waitReady(base);

    const compile = await fetch(`${base}/api/policies/compile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        policyText:
          "This agent can spend up to 1 ETH per day on uniswap ETH/USDC and never between 2-6 UTC",
        defaultPolicyId: "smoke-policy",
      }),
    });
    if (!compile.ok) {
      const text = await compile.text();
      throw new Error(`compile failed ${compile.status}: ${text}`);
    }

    const demo = await fetch(`${base}/api/demo/run-scenario`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "attackReplay" }),
    });
    if (!demo.ok) {
      const text = await demo.text();
      throw new Error(`demo scenario failed ${demo.status}: ${text}`);
    }

    const state = await fetch(`${base}/api/state`);
    if (!state.ok) throw new Error("state endpoint failed");

    const integ = await fetch(`${base}/api/integrations/status`);
    if (!integ.ok) throw new Error("integrations status failed");

    console.log("smoke OK: health, compile, demo, state, integrations/status — PORT was", PORT);
  } finally {
    child.kill("SIGTERM");
    await delay(200);
    if (!child.killed) {
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
    }
    if (!logs.includes("Covenant API running")) {
      console.error("Server log excerpt:\n", logs.slice(-2000));
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

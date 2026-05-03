export type CovenantCheckRequest = {
  agentId: string;
  policyId: string;
  amountWei: string;
  action?: string;
  protocol?: string;
  pair?: string;
  destination?: string;
  destinationCreatedAt?: string;
  memo?: string;
  challengeResponse?: string;
};

export type CovenantDecision = {
  allowed: boolean;
  reason: string;
  ruleId: string;
  requiresChallenge: boolean;
  decisionHash?: string;
  scoreAfter?: number;
  remainingBudget?: string;
  policy?: {
    id: string;
    name: string;
    version: number;
  } | null;
};

type CovenantClientOptions = {
  /** Empty string = same-origin relative URLs (e.g. behind nginx /api proxy). */
  baseUrl?: string;
  /** Matches server COVENANT_API_KEY — sent as Authorization: Bearer */
  apiKey?: string;
  fetchImpl?: typeof fetch;
};

export class CovenantClient {
  private baseUrl: string;

  private fetchImpl: typeof fetch;

  private apiKey?: string;

  constructor(options: CovenantClientOptions = {}) {
    if (options.baseUrl !== undefined && options.baseUrl !== null) {
      this.baseUrl = options.baseUrl;
    } else {
      const g = globalThis as unknown as { process?: { env?: Record<string, string | undefined> } };
      const fromEnv = g.process?.env?.COVENANT_SDK_BASE_URL;
      if (fromEnv !== undefined && fromEnv !== null) {
        this.baseUrl = fromEnv;
      } else {
        throw new Error(
          "CovenantClient requires `baseUrl` (use \"\" for same-origin /api) or COVENANT_SDK_BASE_URL.",
        );
      }
    }
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.apiKey = options.apiKey;
  }

  private jsonHeaders(): HeadersInit {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (this.apiKey) {
      h.Authorization = `Bearer ${this.apiKey}`;
    }
    return h;
  }

  private resolve(path: string): string {
    const base = this.baseUrl;
    if (base === "") {
      return path.startsWith("/") ? path : `/${path}`;
    }
    return `${base.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  }

  async preflight(input: CovenantCheckRequest): Promise<CovenantDecision> {
    const res = await this.fetchImpl(this.resolve("/api/check"), {
      method: "POST",
      headers: this.jsonHeaders(),
      body: JSON.stringify(input),
    });

    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || "Covenant preflight failed");
    }

    const data = await res.json();
    return data.decision as CovenantDecision;
  }

  async commitEvent(payload: { type: string; tone?: string; message: string; policyId?: string; agentId?: string; amountWei?: string }) {
    const res = await this.fetchImpl(this.resolve("/api/events"), {
      method: "POST",
      headers: this.jsonHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || "Failed to commit event");
    }
    return res.json();
  }

  async runScenario(name = "attackReplay") {
    const res = await this.fetchImpl(this.resolve("/api/demo/run-scenario"), {
      method: "POST",
      headers: this.jsonHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || "Scenario execution failed");
    }
    return res.json();
  }

  /** Gensyn AXL snapshot (proxied via Covenant). */
  async axlTopology() {
    const res = await this.fetchImpl(this.resolve("/api/integrations/axl/topology"), {
      method: "GET",
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || "AXL topology failed");
    }
    return res.json() as Promise<{ ok: boolean; topology: Record<string, unknown> }>;
  }

  /** Readiness snapshot (no Trading API secrets returned). */
  async integrationsStatus() {
    const res = await this.fetchImpl(this.resolve("/api/integrations/status"), {
      method: "GET",
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || "integrations status failed");
    }
    return res.json();
  }

  /** Uniswap Trading API probe executed server-side (`UNISWAP_API_KEY` on API host). */
  async uniswapGatewayProbe() {
    const res = await this.fetchImpl(this.resolve("/api/integrations/uniswap/probe"), {
      method: "GET",
      headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || "Uniswap probe failed");
    }
    return res.json();
  }

  /** Validated Gateway quote (requires server `COVENANT_API_KEY` when auth is enabled). */
  async uniswapQuote(body: Record<string, unknown>) {
    const res = await this.fetchImpl(this.resolve("/api/integrations/uniswap/quote"), {
      method: "POST",
      headers: this.jsonHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(data?.error || "Uniswap quote failed");
    }
    return res.json();
  }
}

async function safeJson(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

export function wrapAgent<TInput, TOutput>(
  execute: (input: TInput) => Promise<TOutput>,
  covenant: CovenantClient,
  mapper: (input: TInput) => CovenantCheckRequest,
) {
  return async (input: TInput) => {
    const decision = await covenant.preflight(mapper(input));
    if (!decision.allowed) {
      throw new Error(`Blocked by Covenant: ${decision.reason}`);
    }
    return execute(input);
  };
}

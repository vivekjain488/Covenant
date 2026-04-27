import { useEffect, useState } from "react";
import { CheckCircle2, CircleOff, Network, Server, Wallet } from "lucide-react";
import { getApiBaseUrl, getApiConfig, getAxlBaseUrl, getAxlTopology } from "@/lib/api";

function StatusPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${ok ? "bg-emerald-500/15 text-emerald-200" : "bg-rose-500/15 text-rose-200"}`}>
      {ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleOff className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

export default function IntegrationsPage() {
  const [config, setConfig] = useState(null);
  const [topology, setTopology] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [apiConfig, axl] = await Promise.all([getApiConfig(), getAxlTopology()]);
        if (!cancelled) {
          setConfig(apiConfig);
          setTopology(axl);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load integrations.");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-5 py-4">
      <header className="guardrail-panel p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Integrations</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Protocol connectivity matrix</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Live integration health for backend config and AXL network identity, with direct environment-driven URLs.
        </p>
      </header>

      {error ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <article className="guardrail-panel p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <Server className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">GuardRail API</p>
          </div>

          <p className="text-sm text-zinc-400">Base URL: {getApiBaseUrl()}</p>

          <div className="flex flex-wrap gap-2">
            <StatusPill ok={Boolean(config?.integrations?.keeperHubConfigured)} label="KeeperHub" />
            <StatusPill ok={Boolean(config?.integrations?.uniswapConfigured)} label="Uniswap" />
            <StatusPill ok={Boolean(config?.integrations?.zeroGConfigured)} label="0G" />
            <StatusPill ok={Boolean(config?.integrations?.guardrailRegistryAddress)} label="Registry" />
          </div>

          <p className="text-xs text-zinc-500">Registry address: {config?.integrations?.guardrailRegistryAddress || "not set"}</p>
        </article>

        <article className="guardrail-panel p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <Network className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Gensyn AXL</p>
          </div>

          <p className="text-sm text-zinc-400">AXL URL: {getAxlBaseUrl()}</p>

          {topology ? (
            <div className="space-y-2 text-sm text-zinc-300">
              <p className="inline-flex items-center gap-2"><Wallet className="h-4 w-4" />Public key: {topology.our_public_key}</p>
              <p>IPv6: {topology.our_ipv6}</p>
              <p>Peers discovered: {(topology.peers || []).length}</p>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Topology not reachable yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}

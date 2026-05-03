import { useEffect, useState } from "react";
import { CheckCircle2, CircleOff, Network, Server, Wallet } from "lucide-react";
import { getApiBaseUrl, getApiConfig, getAxlDisplayUrl, getAxlTopology, probeUniswapTrading } from "@/lib/api";

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
  const [axlError, setAxlError] = useState("");
  const [uniswapProbe, setUniswapProbe] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const apiConfig = await getApiConfig();
        if (!cancelled) {
          setConfig(apiConfig);
        }
        try {
          const axl = await getAxlTopology();
          if (!cancelled) {
            setTopology(axl);
            setAxlError("");
          }
        } catch (axlErr) {
          if (!cancelled) {
            setTopology(null);
            setAxlError(axlErr.message || "AXL unreachable");
          }
        }
        try {
          const probe = await probeUniswapTrading();
          if (!cancelled) {
            setUniswapProbe(probe);
          }
        } catch {
          if (!cancelled) {
            setUniswapProbe(null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err.message || "Failed to load integrations.");
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="relative z-10 space-y-5 py-4 text-white">
      <header className="covenant-panel p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Integrations</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Protocol connectivity matrix</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          AXL topology and Uniswap Trading API checks go through Covenant’s API proxy (keys stay on the server). 0G Storage uploads run from the backend after ALLOW when indexer + RPC + signer env are set.
        </p>
      </header>

      {loadError ? <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{loadError}</div> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <article className="covenant-panel p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <Server className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Covenant API</p>
          </div>

          <p className="text-sm text-zinc-400">Base URL: {getApiBaseUrl()}</p>

          <div className="flex flex-wrap gap-2">
            <StatusPill ok={Boolean(config?.integrations?.keeperHubConfigured)} label="KeeperHub" />
            <StatusPill ok={Boolean(config?.integrations?.uniswapConfigured)} label="Uniswap API key" />
            <StatusPill ok={Boolean(uniswapProbe?.ok)} label="Uniswap Gateway probe" />
            <StatusPill ok={Boolean(config?.integrations?.zeroGConfigured)} label="0G signals" />
            <StatusPill ok={Boolean(config?.integrations?.zeroGStorageReady)} label="0G Storage SDK" />
            <StatusPill ok={Boolean(config?.integrations?.covenantRegistryAddress)} label="Registry" />
          </div>

          <p className="text-xs text-zinc-500 leading-6">
            Uniswap Trading API:{" "}
            <span className="text-zinc-400">{config?.integrations?.uniswapTradingBase || "—"}</span>
          </p>
          <p className="text-xs text-zinc-500">Registry address: {config?.integrations?.covenantRegistryAddress || "not set"}</p>
        </article>

        <article className="covenant-panel p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <Network className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Gensyn AXL</p>
          </div>

          <p className="text-sm text-zinc-400">
            Configured node URL: {getAxlDisplayUrl(config) || "(set GENSYN_AXL_URL on the server)"} — live topology via Covenant proxy
          </p>

          {topology ? (
            <div className="space-y-2 text-sm text-zinc-300">
              <p className="inline-flex items-center gap-2"><Wallet className="h-4 w-4" />Public key: {topology.our_public_key}</p>
              <p>IPv6: {topology.our_ipv6}</p>
              <p>Peers discovered: {(topology.peers || []).length}</p>
            </div>
          ) : (
            <p className="text-sm text-rose-200/90">{axlError || "Topology not loaded."}</p>
          )}
        </article>
      </div>
    </section>
  );
}

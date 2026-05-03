import { useEffect, useState } from "react";
import { Activity, AlertTriangle, ArrowRight, Gauge, Shield } from "lucide-react";
import { fetchApiConfig, fetchState } from "@/lib/api";

function MetricCard({ label, value, hint }) {
  return (
    <article className="rounded-3xl border border-white/8 bg-black/40 p-6">
      <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-white">{value}</p>
      <p className="mt-2 text-xs text-zinc-400">{hint}</p>
    </article>
  );
}

export default function Landing() {
  const [state, setState] = useState(null);
  const [config, setConfig] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [s, c] = await Promise.all([fetchState(), fetchApiConfig()]);
        if (!cancelled) {
          setState(s);
          setConfig(c);
        }
      } catch {
        if (!cancelled) {
          setState(null);
        }
      }
    };
    load();
    const interval = setInterval(load, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const metrics = state?.metrics;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="aurora aurora-left" />
        <div className="aurora aurora-right" />
        <div className="grid-noise" />
      </div>

      <main className="relative z-10 mx-auto w-[min(1120px,calc(100%-1.5rem))] py-14">
        <header className="rounded-3xl border border-white/8 bg-black/45 p-8 md:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.3em] text-zinc-400">
            <Shield className="h-3.5 w-3.5" />
            Covenant Protocol
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
            Onchain trust operating system for autonomous agents.
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-400 md:text-base">
            Covenant decides if an agent should be allowed to do something right now, based on policy, runtime risk, and reputation.
            Every decision is persisted, hash-linked, and visible in live forensics.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="/app"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="/app/demo"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.07]"
            >
              Run Attack Replay
            </a>
          </div>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Policies Enforced" value={metrics?.policiesEnforced ?? "-"} hint="Computed from persisted policy store" />
          <MetricCard label="Total Checks" value={metrics?.totalChecks ?? "-"} hint="All policy evaluations to date" />
          <MetricCard label="Transactions Blocked" value={metrics?.transactionsBlocked ?? "-"} hint="Prompt injection + policy violations" />
          <MetricCard label="Median Check" value={metrics?.medianCheckMs ? `${metrics.medianCheckMs}ms` : "-"} hint="Decision engine latency" />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-2">
          <article className="rounded-3xl border border-white/8 bg-black/40 p-6">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-cyan-300" />
              <h2 className="text-lg font-semibold">Live Event Stream</h2>
            </div>
            <div className="mt-4 space-y-3">
              {(state?.events || []).slice(0, 6).map((event) => (
                <div key={`${event.timestamp}-${event.message}`} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{event.type}</span>
                    <span>{event.time}</span>
                  </div>
                  <p className="mt-2 text-sm text-zinc-300">{event.message}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/8 bg-black/40 p-6">
            <div className="flex items-center gap-2">
              <Gauge className="h-4 w-4 text-emerald-300" />
              <h2 className="text-lg font-semibold">Integration Status</h2>
            </div>
            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              <p>KeeperHub: {config?.integrations?.keeperHubConfigured ? "Configured" : "Missing key"}</p>
              <p>Uniswap: {config?.integrations?.uniswapConfigured ? "Configured" : "Missing key"}</p>
              <p>0G: {config?.integrations?.zeroGConfigured ? "Configured" : "Not configured yet"}</p>
              <p>0G Storage SDK upload: {config?.integrations?.zeroGStorageReady ? "Ready" : "Off"}</p>
              <p>Registry: {config?.integrations?.covenantRegistryAddress || "Not set"}</p>
              <p>AXL endpoint: {config?.integrations?.gensynAxlUrl || "-"}</p>
            </div>
            {!config?.integrations?.keeperHubConfigured || !config?.integrations?.uniswapConfigured ? (
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5" />
                Some integrations are intentionally degraded until keys are supplied.
              </div>
            ) : null}
          </article>
        </section>
      </main>
    </div>
  );
}
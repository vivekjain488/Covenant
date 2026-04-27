import { useEffect, useMemo, useState } from "react";
import { Activity, AlertTriangle, Gauge, Link2, ShieldCheck, Zap } from "lucide-react";
import { getApiConfig, getApiState } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

function MetricCard({ label, value, hint }) {
  return (
    <div className="guardrail-panel p-5">
      <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
      <p className="mt-2 text-xs text-zinc-400">{hint}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [state, setState] = useState(null);
  const [config, setConfig] = useState(null);
  const [error, setError] = useState("");
  const { address, workspace } = useWallet();

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [apiState, apiConfig] = await Promise.all([getApiState(), getApiConfig()]);
        if (!cancelled) {
          setState(apiState);
          setConfig(apiConfig);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || "Failed to load dashboard state.");
        }
      }
    }

    loadData();
    const interval = window.setInterval(loadData, 6000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const personalStats = useMemo(() => {
    return {
      policyCount: workspace.personalPolicies.length,
      simulations: workspace.simulationHistory.length,
      riskMode: workspace.profile.riskMode,
    };
  }, [workspace]);

  return (
    <section className="space-y-5 py-4">
      <header className="guardrail-panel p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.3em] text-zinc-500">Dedicated Dashboard</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Operations + Personal Workspace</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          The dashboard combines protocol telemetry from your backend with wallet-isolated data so each user
          has a personal control plane.
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Policies Enforced" value={state?.metrics?.policiesEnforced ?? "-"} hint="Backend live metric" />
        <MetricCard label="Transactions Blocked" value={state?.metrics?.transactionsBlocked ?? "-"} hint="Runtime violations" />
        <MetricCard label="0G Logs Written" value={state?.metrics?.auditLogsWritten ?? "-"} hint="Audit persistence counter" />
        <MetricCard label="Median Check" value={`${state?.metrics?.medianCheckMs ?? "-"}ms`} hint="Policy evaluation latency" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="guardrail-panel p-6">
          <div className="flex items-center gap-2 text-zinc-300">
            <Activity className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Live event stream</p>
          </div>

          <div className="mt-5 space-y-3">
            {(state?.events || []).map((event) => (
              <article key={`${event.type}-${event.time}-${event.message}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span className="uppercase tracking-[0.22em]">{event.type}</span>
                  <span>{event.time}</span>
                </div>
                <p className="mt-2 text-sm text-zinc-300">{event.message}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="guardrail-panel p-6">
            <div className="inline-flex items-center gap-2">
              <Link2 className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Integrations status</p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />KeeperHub key: {config?.integrations?.keeperHubConfigured ? "ready" : "missing"}</p>
              <p className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Uniswap key: {config?.integrations?.uniswapConfigured ? "ready" : "missing"}</p>
              <p className="inline-flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-300" />0G endpoints: {config?.integrations?.zeroGConfigured ? "ready" : "incomplete"}</p>
              <p className="inline-flex items-center gap-2"><Zap className="h-4 w-4 text-cyan-300" />AXL URL: {config?.integrations?.gensynAxlUrl || "-"}</p>
            </div>
          </div>

          <div className="guardrail-panel p-6">
            <div className="inline-flex items-center gap-2">
              <Gauge className="h-4 w-4" />
              <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Personal workspace</p>
            </div>
            <div className="mt-4 space-y-2 text-sm text-zinc-300">
              <p>Wallet: {address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "not connected"}</p>
              <p>Personal policies: {personalStats.policyCount}</p>
              <p>Simulation runs: {personalStats.simulations}</p>
              <p>Risk mode: {personalStats.riskMode}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

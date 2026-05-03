import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { fetchState, fetchEvents, fetchApiConfig, fetchAgentScore } from "@/lib/api";
import { Shield, Activity, TrendingUp, AlertTriangle, Clock, Gauge } from "lucide-react";
import { Link } from "react-router-dom";

export default function DashboardHome() {
  const { isConnected, address, connectWallet } = useWallet();
  const [state, setState] = useState(null);
  const [events, setEvents] = useState([]);
  const [config, setConfig] = useState(null);
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval;
    const load = async () => {
      try {
        const activeAgentId = address ? `${address.slice(0, 10)}.agent` : "default-agent";
        const [s, e, c, sc] = await Promise.all([fetchState(), fetchEvents(), fetchApiConfig(), fetchAgentScore(activeAgentId)]);
        setState(s);
        setEvents(e.events || []);
        setConfig(c);
        setScore(sc);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
    interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [address]);

  if (!isConnected) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center pt-16 text-center max-w-lg mx-auto">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
          <Shield className="h-9 w-9 text-white" />
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white mb-3">Welcome to Covenant</h2>
        <p className="text-zinc-400 mb-8 leading-7">
          Covenant protects your AI agents from unauthorized transactions, prompt injection attacks, and policy violations.
          Connect your wallet to start defining firewall policies for your autonomous agents.
        </p>

        <button
          onClick={connectWallet}
          className="mb-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
        >
          Connect Wallet to Get Started
        </button>

        <div className="w-full grid gap-4 text-left">
          <h3 className="text-xs uppercase tracking-[0.3em] text-zinc-500 text-center">How it works</h3>
          {[
            { step: "1", title: "Connect Your Wallet", desc: "Link your MetaMask to create a personal, isolated workspace." },
            { step: "2", title: "Define Agent Policies", desc: "Set spending limits, whitelist tokens, and configure risk levels." },
            { step: "3", title: "Simulate Attacks", desc: "Test your firewall with our live 3-agent demo to see blocks in action." },
            { step: "4", title: "Deploy & Monitor", desc: "Your agents are protected. Review threat logs and tune policies in real-time." },
          ].map((item) => (
            <div key={item.step} className="flex gap-4 rounded-2xl border border-white/8 bg-white/[0.02] p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">{item.step}</span>
              <div>
                <p className="text-sm font-medium text-white">{item.title}</p>
                <p className="mt-1 text-xs text-zinc-400">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const m = state?.metrics;

  return (
    <div className="relative z-10">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Your Covenant Workspace</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Real-time metrics from your running Covenant policy engine.
        </p>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm animate-pulse">Loading live data from Covenant API...</div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-4 mb-8">
            {[
              { label: "Policies Enforced", value: m?.policiesEnforced ?? "-", icon: Shield, color: "emerald" },
              { label: "Transactions Blocked", value: m?.transactionsBlocked ?? "-", icon: AlertTriangle, color: "rose" },
              { label: "Audit Logs Written", value: m?.auditLogsWritten ?? "-", icon: Activity, color: "cyan" },
              { label: "Median Check Time", value: m?.medianCheckMs ? `${m.medianCheckMs}ms` : "-", icon: Clock, color: "amber" },
            ].map((card) => (
              <div key={card.label} className="rounded-3xl border border-white/8 bg-black/35 p-6 group hover:border-white/15 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{card.label}</p>
                  <card.icon className={`h-4 w-4 text-${card.color}-400`} />
                </div>
                <div className="text-3xl font-semibold tracking-tight text-white">{card.value}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Quick Actions */}
            <div className="rounded-3xl border border-white/8 bg-black/35 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
              <div className="grid gap-3">
                <Link to="/app/policies" className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                    <Shield className="h-5 w-5 text-emerald-400" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">Create a New Policy</p>
                    <p className="text-xs text-zinc-400">Define spending limits and token whitelists for your agents</p>
                  </div>
                </Link>
                <Link to="/app/demo" className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">Run Attack Simulation</p>
                    <p className="text-xs text-zinc-400">Test your firewall against prompt injection & drain attempts</p>
                  </div>
                </Link>
                <Link to="/app/threats" className="flex items-center gap-4 rounded-xl border border-white/8 bg-white/[0.02] p-4 hover:bg-white/[0.04] transition-colors">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-500/20">
                    <AlertTriangle className="h-5 w-5 text-rose-400" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-white">View Threat Logs</p>
                    <p className="text-xs text-zinc-400">Audit every blocked transaction and injection attempt</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Live Event Feed */}
            <div className="rounded-3xl border border-white/8 bg-black/35 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Live Event Feed</h2>
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live
                </span>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto">
                {events.slice(0, 8).map((event, idx) => (
                  <div key={idx} className="flex items-start gap-3 rounded-xl border border-white/6 bg-white/[0.02] p-3">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      event.tone === "emerald" ? "bg-emerald-400" :
                      event.tone === "rose" ? "bg-rose-400" :
                      event.tone === "cyan" ? "bg-cyan-400" : "bg-amber-400"
                    }`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-400">{event.type}</span>
                        <span className="text-[10px] text-zinc-500">{event.time}</span>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-zinc-300 truncate">{event.message}</p>
                    </div>
                  </div>
                ))}
                {events.length === 0 && (
                  <p className="text-sm text-zinc-500 text-center py-8">No events yet. Run a simulation to generate activity.</p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/8 bg-black/35 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">Covenant Score</h2>
                <Gauge className="h-4 w-4 text-zinc-400" />
              </div>
              <p className="mt-2 text-sm text-zinc-400">Reputation updates after every allow/block decision.</p>
              <div className="mt-6 flex items-end gap-3">
                <p className="text-5xl font-bold tracking-tight text-white">{score?.score ?? 500}</p>
                <p className="pb-2 text-xs uppercase tracking-wider text-zinc-400">out of 1000</p>
              </div>
              <div className="mt-4 grid gap-2 text-sm text-zinc-300">
                <p>Checks: {score?.checks ?? 0}</p>
                <p>Blocked: {score?.blocked ?? 0}</p>
                <p>Last update: {score?.lastUpdated ? new Date(score.lastUpdated).toLocaleString() : "N/A"}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-black/35 p-6">
              <h2 className="text-lg font-semibold text-white">Integration Readiness</h2>
              <p className="mt-2 text-sm text-zinc-400">Live status from backend config, no fake sponsor states.</p>
              <div className="mt-5 grid gap-2 text-sm text-zinc-300">
                <p>
                  API auth:{" "}
                  {config?.auth?.apiKeyConfigured
                    ? `enabled (${config?.auth?.publicReadEnabled !== false ? "public GET reads" : "all routes locked"})`
                    : "disabled (dev-open)"}
                </p>
                <p>KeeperHub key: {config?.integrations?.keeperHubConfigured ? "set" : "missing"}</p>
                <p>KeeperHub webhook: {config?.integrations?.keeperHubWebhookConfigured ? "set" : "off"}</p>
                <p>Uniswap key: {config?.integrations?.uniswapConfigured ? "set" : "missing"}</p>
                <p>Uniswap Gateway: {config?.integrations?.uniswapTradingBase || "—"}</p>
                <p>Uniswap notify URL: {config?.integrations?.uniswapNotifyConfigured ? "set" : "off"}</p>
                <p>0G signals: {config?.integrations?.zeroGConfigured ? "set" : "off"}</p>
                <p>0G Storage SDK (audit upload): {config?.integrations?.zeroGStorageReady ? "ready" : "off"}</p>
                <p>0G audit webhook: {config?.integrations?.zeroGAuditWebhookConfigured ? "set" : "off"}</p>
                <p>Gensyn AXL URL: {config?.integrations?.gensynAxlUrl || "-"}</p>
                <p>Registry Address: {config?.integrations?.covenantRegistryAddress || "Not set"}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

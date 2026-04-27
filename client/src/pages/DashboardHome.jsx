import { useWallet } from "../context/WalletContext";

export default function DashboardHome() {
  const { isConnected, workspace } = useWallet();

  if (!isConnected) {
    return (
      <div className="relative z-10 flex flex-col items-center justify-center pt-24 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
          <span className="text-2xl">⚡</span>
        </div>
        <h2 className="text-3xl font-semibold tracking-tight text-white mb-4">Connect to begin</h2>
        <p className="max-w-md text-zinc-400">
          GuardRail requires an active wallet connection to resolve ENS subnames, view agent logs, and update risk policies.
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-10">
      <div className="mb-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Overview</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Your GuardRail Workspace</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your protected agents, adjust transaction thresholds, and review firewall incidents.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border border-white/8 bg-black/35 p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Active Agents</p>
          <div className="mt-4 text-4xl font-semibold tracking-tight text-white">3</div>
          <p className="mt-2 text-sm text-emerald-400">All operating within limits</p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-black/35 p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Current Risk Mode</p>
          <div className="mt-4 text-4xl font-semibold tracking-tight text-white capitalize">{workspace?.profile?.riskMode || "Moderate"}</div>
          <p className="mt-2 text-sm text-zinc-400">System-wide enforcement level</p>
        </div>
        <div className="rounded-3xl border border-white/8 bg-black/35 p-6">
          <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Policies Enforced</p>
          <div className="mt-4 text-4xl font-semibold tracking-tight text-white">{workspace?.personalPolicies?.length || 0}</div>
          <p className="mt-2 text-sm text-cyan-400">Inherited + Custom layers</p>
        </div>
      </div>
    </div>
  );
}

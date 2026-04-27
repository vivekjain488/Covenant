import { ArrowRight, ShieldAlert, Sparkles, WalletCards } from "lucide-react";
import { Link } from "react-router-dom";

const highlights = [
  {
    title: "Policy-first execution",
    desc: "Every transaction path is checked before execution leaves your agent runtime.",
  },
  {
    title: "Wallet-isolated workspace",
    desc: "Each connected wallet gets a personal policy studio and simulation history.",
  },
  {
    title: "Live integration telemetry",
    desc: "Track backend readiness, AXL mesh reachability, and chain deployment status.",
  },
];

export default function HomePage() {
  return (
    <section className="space-y-10 py-8 md:py-12">
      <div className="guardrail-panel overflow-hidden p-8 md:p-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-[11px] uppercase tracking-[0.28em] text-zinc-400">
          <Sparkles className="h-3.5 w-3.5" />
          Multipage Agent Firewall Console
        </div>
        <h1 className="mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.03em] md:text-6xl">
          Run your own personal GuardRail control plane.
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-zinc-400 md:text-lg">
          This version upgrades GuardRail into a proper app with dedicated routes for dashboard analytics,
          policy authoring, transaction simulation, integrations, and per-wallet isolated workspaces.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Open Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/policies"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.03] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-white/[0.06]"
          >
            Create Policy
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => (
          <article key={item.title} className="guardrail-panel p-6">
            <h2 className="text-lg font-semibold tracking-tight">{item.title}</h2>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{item.desc}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="guardrail-panel p-6">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <ShieldAlert className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Security posture</p>
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            GuardRail enforces policy checks before execution, tracks suspicious instruction patterns, and
            logs simulated violations so your agent stack can fail closed by default.
          </p>
        </div>

        <div className="guardrail-panel p-6">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <WalletCards className="h-4 w-4" />
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Personal mode</p>
          </div>
          <p className="mt-4 text-sm leading-7 text-zinc-400">
            Connect a wallet from the top-right panel. GuardRail will create a local isolated workspace
            for that wallet so each user can safely manage their own policy profile and simulation state.
          </p>
        </div>
      </div>
    </section>
  );
}

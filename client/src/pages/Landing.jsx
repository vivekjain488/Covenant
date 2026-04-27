import { useEffect, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Bot,
  BrainCircuit,
  ChevronRight,
  Clock3,
  Database,
  Gauge,
  Globe2,
  LockKeyhole,
  ListChecks,
  Menu,
  Network,
  Radar,
  Shield,
  ShieldAlert,
  Sparkles,
  X,
  Zap,
} from "lucide-react";

const metrics = [
  { label: "Policies Enforced", value: "128", delta: "+18 today", tone: "emerald" },
  { label: "Transactions Blocked", value: "37", delta: "5 injection attempts", tone: "rose" },
  { label: "Local DB Logs", value: "94", delta: "append-only", tone: "cyan" },
  { label: "Median Check Time", value: "82ms", delta: "p95 141ms", tone: "amber" },
];

const architecture = [
  {
    step: "Layer 1",
    title: "Policy Engine",
    icon: Shield,
    description: "Create, inherit, and version JSON policy trees directly on-chain.",
  },
  {
    step: "Layer 2",
    title: "Firewall Runtime",
    icon: Radar,
    description: "Pre-flight transaction scoring, rate limiting, and contract allowlists.",
  },
  {
    step: "Layer 3",
    title: "ENS Resolution",
    icon: Globe2,
    description: "Bind policies and rotating addresses to agent subnames.",
  },
  {
    step: "Layer 4",
    title: "KeeperHub Relay",
    icon: Network,
    description: "Forward approved actions and preserve a signed audit trail.",
  },
  {
    step: "Layer 5",
    title: "Local Logging",
    icon: Database,
    description: "Persist blocked activity and threat intelligence as immutable logs.",
  },
];

const capabilities = [
  {
    icon: ListChecks,
    title: "Agent policy CRUD",
    description: "Operators can author and rotate policy trees without touching application code.",
  },
  {
    icon: BrainCircuit,
    title: "Injection scoring",
    description: "Pattern-based filtering pairs with a deterministic risk score for prompt abuse.",
  },
  {
    icon: Gauge,
    title: "Velocity guards",
    description: "Rolling 1h and 1d budgets stop burst spending before it leaves the wallet.",
  },
  {
    icon: LockKeyhole,
    title: "Execution gates",
    description: "Approved transactions are relayed only after policy checks and audit logging succeed.",
  },
];

const integrations = [
  "KeeperHub",
  "Local DB",
  "ENS",
  "Uniswap",
  "Gensyn AXL",
  "OpenZeppelin",
  "Hardhat",
  "Viem",
];

const baseEvents = [
  {
    type: "ALLOW",
    tone: "emerald",
    message: "Conservative agent submitted a $42 treasury rebalance within policy.",
    time: "12:41:05",
  },
  {
    type: "BLOCK",
    tone: "rose",
    message: "Prompt injection pattern detected in a swap memo and denied before execution.",
    time: "12:41:17",
  },
  {
    type: "LOG",
    tone: "cyan",
    message: "Violation appended to local storage with sanitized metadata and hash trail.",
    time: "12:41:29",
  },
  {
    type: "SYNC",
    tone: "amber",
    message: "AXL mesh broadcasted a new threat signature to peer agents.",
    time: "12:41:44",
  },
  {
    type: "EXECUTE",
    tone: "emerald",
    message: "KeeperHub received an approved instruction after policy verification.",
    time: "12:42:01",
  },
  {
    type: "LIMIT",
    tone: "amber",
    message: "Daily spend window recalculated after a one-hour budget rollover.",
    time: "12:42:18",
  },
];

const dashboardBars = [72, 88, 64, 94, 70, 82, 77, 91];

const assistantSeed = [
  {
    speaker: "GuardRail",
    text: "I am watching spend velocity, injection markers, and contract destinations in real time.",
  },
  {
    speaker: "Analyst",
    text: "Show me the last blocked transaction and why it failed.",
  },
  {
    speaker: "GuardRail",
    text: "Blocked because the payload matched a policy-bypass instruction and exceeded the 1h threshold.",
  },
];

function formatMetricTone(tone) {
  switch (tone) {
    case "emerald":
      return "text-emerald-300 bg-emerald-500/10 border-emerald-500/20";
    case "rose":
      return "text-rose-300 bg-rose-500/10 border-rose-500/20";
    case "cyan":
      return "text-cyan-300 bg-cyan-500/10 border-cyan-500/20";
    case "amber":
      return "text-amber-300 bg-amber-500/10 border-amber-500/20";
    default:
      return "text-zinc-300 bg-zinc-500/10 border-zinc-500/20";
  }
}

function tonality(tone) {
  switch (tone) {
    case "emerald":
      return "bg-emerald-400";
    case "rose":
      return "bg-rose-400";
    case "cyan":
      return "bg-cyan-400";
    case "amber":
      return "bg-amber-400";
    default:
      return "bg-zinc-400";
  }
}

function MicroLabel({ children }) {
  return <p className="text-[10px] uppercase tracking-[0.34em] text-zinc-500">{children}</p>;
}

function Panel({ className = "", children }) {
  return <div className={`guardrail-panel ${className}`}>{children}</div>;
}

function StatCard({ metric }) {
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <MicroLabel>{metric.label}</MicroLabel>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">{metric.value}</div>
        </div>
        <span className={`rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.28em] ${formatMetricTone(metric.tone)}`}>
          {metric.delta}
        </span>
      </div>
    </Panel>
  );
}

function EventRow({ event }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/6 bg-white/[0.02] p-4 transition-colors hover:border-white/12 hover:bg-white/[0.04]">
      <span className={`mt-1 h-2.5 w-2.5 rounded-full ${tonality(event.tone)}`} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-4">
          <span className="text-[11px] uppercase tracking-[0.28em] text-zinc-400">{event.type}</span>
          <span className="text-[11px] text-zinc-500">{event.time}</span>
        </div>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{event.message}</p>
      </div>
    </div>
  );
}

function FeatureCard({ feature }) {
  const Icon = feature.icon;

  return (
    <Panel className="group p-6 transition-transform duration-500 hover:-translate-y-1">
      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] transition-colors group-hover:border-white/20">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold tracking-tight text-white">{feature.title}</h3>
      <p className="mt-3 text-sm leading-7 text-zinc-400">{feature.description}</p>
    </Panel>
  );
}

export default function App() {
  const [events, setEvents] = useState(baseEvents);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState(assistantSeed);
  const cursorRef = useRef(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const template = baseEvents[cursorRef.current % baseEvents.length];
      const bump = cursorRef.current + 1;
      cursorRef.current = bump;

      setEvents((current) =>
        [
          {
            ...template,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
            message:
              bump % 2 === 0
                ? `${template.message} Policy hash ${bump.toString(16).toUpperCase()} committed to the audit trail.`
                : template.message,
          },
          ...current,
        ].slice(0, 6),
      );

      setAssistantMessages((current) =>
        [
          ...current.slice(-3),
          {
            speaker: "GuardRail",
            text:
              bump % 2 === 0
                ? "The latest event was blocked, logged, and broadcasted to peers with sanitized metadata."
                : "The current agent posture remains within policy and ready for KeeperHub relay.",
          },
        ].slice(-4),
      );
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="aurora aurora-left" />
        <div className="aurora aurora-right" />
        <div className="grid-noise" />
      </div>

      <header className="sticky top-4 z-30 mx-auto flex w-[min(1120px,calc(100%-1.5rem))] items-center justify-between rounded-full border border-white/8 bg-black/55 px-4 py-3 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight text-white">GuardRail</p>
            <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Agent firewall protocol</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1 md:flex">
          {[
            ["Architecture", "#architecture"],
            ["Dashboard", "/app"],
            ["Integrations", "#integrations"],
            ["Demo", "#demo"],
          ].map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="rounded-full px-4 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:border-white/20 hover:text-white md:hidden"
            type="button"
            aria-label="Open navigation"
          >
            <Menu className="h-4 w-4" />
          </button>
          <a
            href="/app"
            className="inline-flex items-center gap-2 rounded-full border border-white bg-white px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-zinc-200"
          >
            Open dashboard
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </header>

      <main className="mx-auto w-[min(1120px,calc(100%-1.5rem))] pb-24 pt-14 md:pt-18">
        <section className="relative flex min-h-[100vh] flex-col justify-center py-16 md:py-24">
          <div className="grid gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-zinc-400">
                <Sparkles className="h-3.5 w-3.5 text-zinc-200" />
                ETH Global Open Agents protocol demo
              </div>

              <div className="space-y-6">
                <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.05em] text-white md:text-7xl lg:text-8xl">
                  The firewall that audits agents before they move value.
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-zinc-400 md:text-xl">
                  GuardRail sits between autonomous agents and execution surfaces. It scores intent, applies policy trees,
                  writes violations to a local JSON log, and relays approved actions through KeeperHub.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <a
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  Explore the dashboard
                  <ChevronRight className="h-4 w-4" />
                </a>
                <a
                  href="#architecture"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:border-white/20 hover:bg-white/[0.05]"
                >
                  View architecture
                </a>
              </div>

              <div className="flex items-center gap-4 pt-4 text-sm text-zinc-500">
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  37 active policy checks
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                  Local audit sink online
                </span>
              </div>
            </div>

            <div className="relative">
              <Panel className="relative overflow-hidden p-6 md:p-8">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
                <MicroLabel>Live policy posture</MicroLabel>
                <div className="mt-6 space-y-5">
                  <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                    <div>
                      <p className="text-sm font-medium text-white">Risk score</p>
                      <p className="mt-1 text-sm text-zinc-500">Lower values indicate stronger execution confidence.</p>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-semibold tracking-tight text-white">18</div>
                      <p className="text-xs uppercase tracking-[0.28em] text-emerald-300">Safe</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-black/35 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Spend velocity</span>
                      <span className="text-xs text-zinc-400">1h / 1d policy window</span>
                    </div>
                    <div className="mt-4 grid grid-cols-8 gap-2">
                      {dashboardBars.map((value, index) => (
                        <div key={index} className="flex h-36 items-end rounded-xl bg-white/[0.02] p-1">
                          <div
                            className="w-full rounded-lg bg-gradient-to-t from-zinc-300 via-zinc-500 to-white/90"
                            style={{ height: `${value}%` }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      ["Allowed", "19"],
                      ["Blocked", "7"],
                      ["Broadcasts", "12"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                        <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{label}</p>
                        <p className="mt-3 text-2xl font-semibold tracking-tight text-white">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </Panel>

              <div className="absolute -bottom-5 left-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/80 px-4 py-2 text-xs text-zinc-400 shadow-[0_15px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                GuardRail runtime connected
              </div>
            </div>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-4">
            {metrics.map((metric) => (
              <StatCard key={metric.label} metric={metric} />
            ))}
          </div>
        </section>

        <section id="architecture" className="py-20 md:py-24">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <MicroLabel>Architecture</MicroLabel>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Seven layers, one control plane.</h2>
            </div>
            <p className="hidden max-w-xl text-sm leading-7 text-zinc-500 md:block">
              Each layer has a single responsibility: decide, relay, log, or broadcast. Nothing executes without a deterministic
              guardrail decision.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-5">
            {architecture.map((layer, index) => {
              const Icon = layer.icon;

              return (
                <Panel key={layer.title} className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[11px] uppercase tracking-[0.3em] text-zinc-500">{layer.step}</span>
                    <Icon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <h3 className="mt-8 text-xl font-semibold tracking-tight text-white">{layer.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-zinc-400">{layer.description}</p>
                  {index < architecture.length - 1 ? (
                    <div className="mt-8 flex items-center gap-2 text-zinc-600">
                      <span className="h-px flex-1 bg-white/10" />
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  ) : null}
                </Panel>
              );
            })}
          </div>
        </section>

        <section className="py-20 md:py-24">
          <div className="mb-8">
            <MicroLabel>Capabilities</MicroLabel>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Operator-grade control for autonomous systems.</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {capabilities.map((feature) => (
              <FeatureCard key={feature.title} feature={feature} />
            ))}
          </div>
        </section>

        <section id="integrations" className="py-20 md:py-24">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <MicroLabel>Integrations</MicroLabel>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Sponsor stack, stitched into one flow.</h2>
            </div>
            <p className="hidden max-w-lg text-sm leading-7 text-zinc-500 md:block">
              The project is wired for KeeperHub execution, local logging persistence, ENS naming, Uniswap telemetry, and AXL threat
              propagation.
            </p>
          </div>

          <div className="marquee-mask rounded-[2rem] border border-white/8 bg-white/[0.025] py-5">
            <div className="marquee-track flex min-w-max items-center gap-8 px-6 text-sm uppercase tracking-[0.34em] text-zinc-400">
              {[...integrations, ...integrations].map((item, index) => (
                <span key={`${item}-${index}`} className="inline-flex items-center gap-3 whitespace-nowrap">
                  <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="dashboard" className="py-20 md:py-24">
          <div className="mb-8 flex items-end justify-between gap-6">
            <div>
              <MicroLabel>Dashboard</MicroLabel>
              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-5xl">Live agent telemetry and execution control.</h2>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.28em] text-zinc-400 md:flex">
              <Clock3 className="h-3.5 w-3.5" />
              refreshed continuously
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
            <Panel className="p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <MicroLabel>Primary insights</MicroLabel>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Live Agent Swap metrics</h3>
                </div>
                <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-emerald-300">
                  green zone
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ["Pre-check pass rate", "96.1%", "+2.4%"],
                  ["Policy depth", "5 layers", "3 inherited"],
                  ["Avg. block reason", "prompt injection", "27 hits"],
                ].map(([label, value, meta]) => (
                  <div key={label} className="rounded-3xl border border-white/8 bg-black/35 p-5">
                    <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">{label}</p>
                    <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
                    <p className="mt-2 text-sm text-zinc-400">{meta}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[1.75rem] border border-white/8 bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.28em] text-zinc-500">Spending velocity</p>
                    <p className="mt-2 text-sm text-zinc-400">Rolling 1h and 1d windows collapse bursty behavior into a single policy decision.</p>
                  </div>
                  <Gauge className="h-5 w-5 text-zinc-400" />
                </div>
                <div className="mt-5 grid grid-cols-8 gap-2">
                  {dashboardBars.map((value, index) => (
                    <div key={index} className="flex h-40 items-end rounded-2xl bg-white/[0.02] p-1.5">
                      <div
                        className="w-full rounded-xl bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(161,161,170,0.35))]"
                        style={{ height: `${value}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between text-xs uppercase tracking-[0.28em] text-zinc-500">
                  <span>Window 1h</span>
                  <span>Window 1d</span>
                </div>
              </div>
            </Panel>

            <Panel className="p-6 md:p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <MicroLabel>Realtime stream</MicroLabel>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Event feed</h3>
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-zinc-300">
                  <Activity className="h-4 w-4" />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {events.map((event) => (
                  <EventRow key={`${event.type}-${event.time}-${event.message.slice(0, 16)}`} event={event} />
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {[
                  [BadgeCheck, "keeperhub", "approved relay"],
                  [AlertTriangle, "Local DB", "violation sink"],
                  [ShieldAlert, "ens", "policy anchor"],
                  [Zap, "axl", "threat broadcast"],
                ].map(([Icon, label, value]) => (
                  <div key={label} className="rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-4 w-4 text-zinc-400" />
                      <span className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">{label}</span>
                    </div>
                    <p className="mt-5 text-sm text-white">{value}</p>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>

        <section id="demo" className="py-20 md:py-24">
          <Panel className="overflow-hidden p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <MicroLabel>Closing call to action</MicroLabel>
                <h2 className="mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white md:text-5xl">
                  Ship the firewall, then let agents move with policy-backed confidence.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
                  This prototype is set up to expand into live KeeperHub execution, ENS policy resolution, local JSON logging, and
                  AXL broadcast workflows as the external keys are wired in.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
                <a
                  href="#architecture"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-6 py-3.5 text-sm font-medium text-white transition-colors hover:border-white/20 hover:bg-white/[0.06]"
                >
                  Read the layers
                </a>
                <a
                  href="/app"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
                >
                  Go to dashboard
                </a>
              </div>
            </div>
          </Panel>
        </section>
      </main>

      <footer className="border-t border-white/8 py-10">
        <div className="mx-auto flex w-[min(1120px,calc(100%-1.5rem))] flex-col gap-4 text-sm text-zinc-500 md:flex-row md:items-center md:justify-between">
          <p>GuardRail Protocol · Autonomous agent defense for the Open Agents stack.</p>
          <div className="flex items-center gap-4">
            <a className="transition-colors hover:text-white" href="#architecture">
              Architecture
            </a>
            <a className="transition-colors hover:text-white" href="/app">
              Dashboard
            </a>
            <a className="transition-colors hover:text-white" href="#demo">
              Demo
            </a>
          </div>
        </div>
      </footer>

      <button
        type="button"
        onClick={() => setAssistantOpen((value) => !value)}
        className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform hover:-translate-y-0.5"
        aria-label="Toggle GuardRail assistant"
      >
        {assistantOpen ? <X className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
      </button>

      {assistantOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-4 py-6 backdrop-blur-sm md:items-center">
          <Panel className="w-full max-w-xl overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
              <div>
                <p className="text-sm font-medium text-white">GuardRail AI</p>
                <p className="text-xs uppercase tracking-[0.28em] text-zinc-500">policy copilot</p>
              </div>
              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                className="rounded-full border border-white/8 bg-white/[0.03] p-2 text-zinc-300 transition-colors hover:text-white"
                aria-label="Close assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              {assistantMessages.map((message, index) => (
                <div
                  key={`${message.speaker}-${index}`}
                  className={`max-w-[88%] rounded-2xl border px-4 py-3 text-sm leading-6 ${
                    message.speaker === "GuardRail"
                      ? "border-white/8 bg-white/[0.04] text-zinc-200"
                      : "ml-auto border-cyan-500/20 bg-cyan-500/10 text-cyan-50"
                  }`}
                >
                  <p className="mb-1 text-[10px] uppercase tracking-[0.28em] text-zinc-500">{message.speaker}</p>
                  {message.text}
                </div>
              ))}
            </div>

            <div className="border-t border-white/8 px-5 py-4 text-xs text-zinc-500">
              Runtime note: live integrations will activate once the KeeperHub, Local DB, ENS, and AXL environment variables are
              supplied.
            </div>
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
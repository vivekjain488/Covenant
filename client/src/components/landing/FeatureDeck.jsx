import { cn } from "@/lib/utils";
import { ScalesFramedBox } from "@/components/scales-with-image-demo";

const FEATURES = [
  {
    kicker: "Policy fabric",
    title: "Author once, compile everywhere.",
    body: "Natural language becomes structured policy with version history and instant rollbacks—every tweak hash-addressable downstream.",
    note: "~50 ms median check",
  },
  {
    kicker: "Runtime enforcement",
    title: "Stop injected treasury escapes.",
    body: "Caps, freshness controls, challenger flows, reputational deltas—explainable denies with receipts agents can reconcile.",
    note: "Hash-linked decisions",
  },
  {
    kicker: "Protocol mesh",
    title: "Uniswap · Gensyn AXL · 0G",
    body: "Connect Covenant to liquidity, storage, and compute behind your API—agents never see signing keys or opaque routes.",
    note: "Keys on the edge",
  },
];

export function FeatureDeck({ className }) {
  return (
    <section className={cn("js-landing-features", className)}>
      <div className="flex flex-col items-center text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-500/80">Capability lines</p>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white md:text-4xl">Programmable trust without card clutter</h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
          Covenant is the stoplight between intent and settlement—readable policies, deterministic retries, and hooks you stitch into relays,
          auditors, or rollup bridges.
        </p>
      </div>

      <div className="mt-14 grid gap-12 border-t border-white/[0.07] pt-14 md:grid-cols-3 md:gap-8">
        {FEATURES.map((f) => (
          <ScalesFramedBox
            key={f.kicker}
            variant="column"
            scalesSize={8}
            className="js-landing-feature-col"
            innerClassName="justify-start px-8 pb-9 pt-10 text-left"
          >
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-zinc-600">{f.kicker}</p>
            <h3 className="mt-4 text-lg font-semibold text-zinc-100">{f.title}</h3>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-500">{f.body}</p>
            <p className="mt-8 text-xs text-cyan-500/80">{f.note}</p>
          </ScalesFramedBox>
        ))}
      </div>
    </section>
  );
}

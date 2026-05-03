import { cn } from "@/lib/utils";

const PROTOCOL_STACK = [
  { id: "uniswap", wordmark: "Uniswap", line: "Liquidity & routes" },
  { id: "zero", wordmark: "0G Storage", line: "Audit & blobs" },
  { id: "gensyn", wordmark: "Gensyn AXL", line: "Distributed compute" },
  { id: "evm", wordmark: "EVM & relays", line: "Settlement on your rails" },
  { id: "agents", wordmark: "Agents & MCP", line: "Policy before action" },
];

export function ArchitectureFlow() {
  return (
    <div className="relative mx-auto max-w-5xl pb-6 md:pb-10">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-400/[0.08] blur-3xl" />

      <div className="flex flex-col items-center text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-cyan-500">Where Covenant sits</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Between autonomy and settlement
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
          Policies compile once; checks run before funds move. Covenant connects to protocols and infra you already rely on—you keep keys and fulfillment.
        </p>
      </div>

      <div className="relative mt-16 grid gap-12 rounded-3xl border border-white/[0.08] bg-white/[0.02] p-8 shadow-2xl backdrop-blur-sm lg:grid-cols-[minmax(0,1.1fr)_minmax(240px,340px)] lg:gap-16 lg:p-12 xl:gap-20">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.26em] text-zinc-500">Stacks in the mesh</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4 sm:justify-start">
            {PROTOCOL_STACK.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "flex min-w-[10rem] max-w-[12rem] flex-col rounded-2xl border border-white/10 bg-black/40 p-5 text-center transition-all hover:border-cyan-500/30 hover:bg-cyan-500/5 sm:text-left",
                  i % 2 === 1 && "md:translate-y-6"
                )}
              >
                <div className="mb-4 h-8 w-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent" />
                <p className="text-[1.08rem] font-semibold tracking-[-0.03em] text-white md:text-xl">{p.wordmark}</p>
                <p className="mt-2 text-[12px] leading-snug text-zinc-400 md:text-[13px]">{p.line}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="flex flex-col justify-center border-t border-white/[0.06] pt-10 lg:border-l lg:border-t-0 lg:pl-12 lg:pt-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-500/80">Mediation</p>
          <p className="mt-5 text-lg font-medium leading-snug tracking-tight text-white md:text-xl">
            Intent <span className="mx-2 font-normal text-zinc-600">→</span> policy check{" "}
            <span className="mx-2 font-normal text-zinc-600">→</span> receipt
          </p>
          <div className="my-6 h-px w-20 bg-gradient-to-r from-cyan-500/50 to-transparent" aria-hidden />
          <p className="text-sm leading-relaxed text-zinc-400">
            Custody stays on your infra; Covenant only emits verdicts operators can reconcile.
          </p>
        </aside>
      </div>

      <p className="mx-auto mt-14 max-w-lg text-center text-sm leading-relaxed text-zinc-500 md:mt-16">
        No substitute signer—only audit-grade signal between agents and rails.
      </p>
    </div>
  );
}

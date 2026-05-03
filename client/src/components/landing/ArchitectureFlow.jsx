import { cn } from "@/lib/utils";
import { ArrowRight, ArrowDown, ArrowUp, Database, Cpu, Network, Shield, Layers, Blocks } from "lucide-react";

function Node({ title, subtitle, icon: Icon, className }) {
  return (
    <div
      className={cn(
        "relative z-10 flex w-[13rem] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/40 p-5 text-center backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/30 hover:bg-white/[0.02]",
        className
      )}
    >
      {Icon && <Icon className="mb-3 h-7 w-7 text-zinc-400" />}
      <h3 className="text-[15px] font-semibold text-zinc-100">{title}</h3>
      <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500">{subtitle}</p>
    </div>
  );
}

function ConnectionHorizontal() {
  return (
    <div className="hidden flex-1 items-center justify-center px-2 md:flex">
      <div className="relative h-px w-[4rem] bg-gradient-to-r from-cyan-500/20 via-cyan-500/60 to-cyan-500/20 lg:w-[6rem]">
        <ArrowRight className="absolute -translate-y-1/2 right-0 top-1/2 h-4 w-4 text-cyan-500" />
      </div>
    </div>
  );
}

function ConnectionVertical({ down = true, height = "h-10" }) {
  return (
    <div className={cn("hidden flex-col items-center justify-center py-1 md:flex", height)}>
      <div className="relative h-full w-px bg-gradient-to-b from-cyan-500/20 via-cyan-500/60 to-cyan-500/20">
        {down ? (
          <ArrowDown className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 text-cyan-500" />
        ) : (
          <ArrowUp className="absolute top-0 left-1/2 h-4 w-4 -translate-x-1/2 text-cyan-500" />
        )}
      </div>
    </div>
  );
}

export function ArchitectureFlow() {
  return (
    <div className="relative mx-auto max-w-[1200px] pb-6 md:pb-16">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[42%] h-64 w-64 -translate-x-1/2 rounded-full bg-cyan-400/[0.05] blur-[100px]" />

      <div className="flex flex-col items-center text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-cyan-500">Where Covenant sits</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white md:text-4xl">
          Between autonomy and settlement
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-400">
          Policies compile once; checks run before funds move. Covenant connects to protocols and infra you already rely on—you keep keys and fulfillment.
        </p>
      </div>

      {/* Desktop Grid Architecture */}
      <div className="mt-20 hidden items-center justify-center md:flex">
        <div className="grid grid-cols-[auto_auto_auto_auto_auto] items-center justify-items-center">
          
          {/* Row 1 (Top peripheries) */}
          <div /> {/* Left */}
          <div /> {/* H-Conn */}
          <Node title="0G Storage" subtitle="Audit & blobs" icon={Database} className="h-28" />
          <div /> {/* H-Conn */}
          <Node title="Uniswap" subtitle="Liquidity & routes" icon={Layers} className="h-28" />

          {/* Connectors from Row 1 to Row 2 */}
          <div />
          <div />
          <ConnectionVertical down={true} height="h-10" />
          <div />
          <ConnectionVertical down={true} height="h-10" />

          {/* Row 2 (Main Execution Flow) */}
          <Node title="Agents & MCP" subtitle="Policy before action" icon={Network} className="h-44 w-[12rem]" />
          <ConnectionHorizontal />
          
          <div className="relative z-10 flex h-44 w-[16rem] flex-col items-center justify-center rounded-3xl border border-cyan-500/40 bg-cyan-950/30 p-6 text-center shadow-[0_0_40px_rgba(6,182,212,0.12)] transition-all hover:border-cyan-400/60 lg:w-[18rem]">
            <Shield className="mb-3 h-9 w-9 text-cyan-400" />
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-500/80">Mediation</p>
            <h3 className="mb-3 text-lg font-bold text-white lg:text-xl">Covenant Protocol</h3>
            <div className="flex items-center gap-1.5 rounded-full border border-white/5 bg-black/40 px-3 py-1.5 text-[10px] text-zinc-300 lg:text-[11px]">
              <span>Intent</span> <ArrowRight className="h-3 w-3 text-cyan-500/50" />
              <span>Policy</span> <ArrowRight className="h-3 w-3 text-cyan-500/50" />
              <span>Receipt</span>
            </div>
          </div>
          
          <ConnectionHorizontal />
          <Node title="EVM & relays" subtitle="Settlement on your rails" icon={Blocks} className="h-44 w-[12rem]" />

          {/* Connectors from Row 2 to Row 3 */}
          <div />
          <div />
          <ConnectionVertical down={false} height="h-10" />
          <div />
          <div />

          {/* Row 3 (Bottom peripheries) */}
          <div />
          <div />
          <Node title="Gensyn AXL" subtitle="Distributed compute" icon={Cpu} className="h-28" />
          <div />
          <div />

        </div>
      </div>

      {/* Mobile Flow Fallback */}
      <div className="mt-14 flex flex-col items-center gap-6 md:hidden">
        <Node title="Agents & MCP" subtitle="Policy before action" icon={Network} className="h-32 w-full max-w-[16rem]" />
        
        <div className="flex flex-col items-center py-2">
          <div className="relative h-10 w-px bg-gradient-to-b from-cyan-500/20 via-cyan-500/60 to-cyan-500/20">
            <ArrowDown className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 text-cyan-500" />
          </div>
        </div>
        
        <div className="relative z-10 flex h-36 w-full max-w-[16rem] flex-col items-center justify-center rounded-3xl border border-cyan-500/40 bg-cyan-950/30 p-6 text-center shadow-[0_0_30px_rgba(6,182,212,0.12)]">
          <Shield className="mb-2 h-8 w-8 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">Covenant Protocol</h3>
          <p className="mt-1 text-[11px] text-zinc-300">Intent → Policy → Receipt</p>
        </div>
        
        <div className="flex flex-col items-center py-2">
          <div className="relative h-10 w-px bg-gradient-to-b from-cyan-500/20 via-cyan-500/60 to-cyan-500/20">
            <ArrowDown className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 text-cyan-500" />
          </div>
        </div>
        
        <Node title="EVM & relays" subtitle="Settlement on your rails" icon={Blocks} className="h-32 w-full max-w-[16rem]" />
        
        <div className="my-6 h-px w-full max-w-[16rem] bg-white/[0.06]" />
        
        <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">Connected Mesh Infrastructure</p>
        <div className="grid w-full max-w-[20rem] grid-cols-2 gap-4">
          <Node title="0G Storage" subtitle="Audit & blobs" icon={Database} className="h-28 w-full" />
          <Node title="Gensyn AXL" subtitle="Distributed compute" icon={Cpu} className="h-28 w-full" />
          <Node title="Uniswap" subtitle="Liquidity & routes" icon={Layers} className="col-span-2 h-28 w-full" />
        </div>
      </div>

      <p className="mx-auto mt-16 max-w-lg text-center text-[13px] leading-relaxed text-zinc-500 md:mt-24">
        No substitute signer—only audit-grade signal between agents and rails.
      </p>
    </div>
  );
}

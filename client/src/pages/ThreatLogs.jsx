import { useWallet } from "../context/WalletContext";
import { AlertTriangle, Clock, TerminalSquare, AlertCircle } from "lucide-react";

const DEMO_LOGS = [
  {
    id: "log_1",
    time: "2 mins ago",
    agent: "trader-bot.guardrail.eth",
    ruleViolated: "max_swap_usd_per_tx",
    reason: "Attempted swap of $850 exceeds 1h window limit of $500.",
    score: 12,
    txHash: "0x8a9f...e2a1"
  },
  {
    id: "log_2",
    time: "14 mins ago",
    agent: "savings-bot.guardrail.eth",
    ruleViolated: "allowed_tokens",
    reason: "Target token PEPE is not in the allowed token whitelist.",
    score: 8,
    txHash: "0x11bb...99cc"
  },
  {
    id: "log_3",
    time: "1 hour ago",
    agent: "attacker.guardrail.eth",
    ruleViolated: "prompt_injection",
    reason: "High risk payload signature matched: 'ignore previous instructions'",
    score: 96,
    txHash: "0xdead...beef"
  }
];

export default function ThreatLogs() {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-zinc-600 mb-4" />
        <h2 className="text-xl font-semibold text-white">Wallet not connected</h2>
        <p className="text-zinc-400 mt-2 text-sm">Please connect your wallet to view your local violation logs.</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 text-white max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Violation Logs</h1>
        <p className="mt-2 text-sm text-zinc-400">Layer 5: Immutable record of blocked transactions and injection patterns.</p>
      </div>

      <div className="grid gap-4">
        {DEMO_LOGS.map(log => (
          <div key={log.id} className="rounded-2xl border border-white/8 bg-black/35 p-5 md:p-6 transition-colors hover:border-white/15">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex gap-4">
                <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                  log.score > 80 ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {log.score > 80 ? <AlertCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-white">{log.agent}</span>
                    <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                      {log.ruleViolated}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{log.reason}</p>
                  
                  <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {log.time}</span>
                    <span className="flex items-center gap-1.5"><TerminalSquare className="h-3.5 w-3.5" /> TX: {log.txHash}</span>
                  </div>
                </div>
              </div>
              
              <div className="shrink-0 text-right self-end md:self-auto">
                <div className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 mb-1">Risk Score</div>
                <div className={`text-2xl font-semibold tracking-tight ${log.score > 80 ? 'text-rose-400' : 'text-amber-400'}`}>
                  {log.score}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

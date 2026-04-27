import { useState } from "react";
import { PlayCircle, ShieldAlert } from "lucide-react";
import { runPolicyCheck } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

export default function AgentStudioPage() {
  const { updateWorkspace } = useWallet();
  const [form, setForm] = useState({
    policyId: "conservative-agent",
    amountWei: "100000000000000000",
    memo: "swap 0.1 ETH to USDC",
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSimulate(event) {
    event.preventDefault();
    setError("");

    try {
      const response = await runPolicyCheck(form);
      setResult(response);

      updateWorkspace((current) => ({
        ...current,
        simulationHistory: [
          {
            timestamp: new Date().toISOString(),
            input: form,
            output: response,
          },
          ...(current.simulationHistory || []),
        ].slice(0, 50),
      }));
    } catch (simulationError) {
      setResult(null);
      setError(simulationError.message || "Simulation failed.");
    }
  }

  return (
    <section className="space-y-5 py-4">
      <header className="guardrail-panel p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Agent Studio</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Simulate policy checks before execution</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          This studio sends a pre-execution transaction payload through GuardRail backend rules and returns
          allow/block decisions with reason strings.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <form onSubmit={handleSimulate} className="guardrail-panel p-6 space-y-4">
          <label className="block text-sm text-zinc-300">
            Policy ID
            <input
              value={form.policyId}
              onChange={(event) => setForm((current) => ({ ...current, policyId: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-white/20"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Amount (wei)
            <input
              value={form.amountWei}
              onChange={(event) => setForm((current) => ({ ...current, amountWei: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-white/20"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Instruction / Memo
            <textarea
              value={form.memo}
              onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))}
              className="mt-2 min-h-[120px] w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-white/20"
            />
          </label>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            <PlayCircle className="h-4 w-4" />
            Run Check
          </button>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </form>

        <div className="guardrail-panel p-6">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <ShieldAlert className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Simulation output</p>
          </div>

          {!result ? (
            <p className="mt-4 text-sm text-zinc-500">No simulation yet. Submit a payload from the left panel.</p>
          ) : (
            <div className="mt-4 space-y-3 text-sm">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-zinc-400">Decision</p>
                <p className={`mt-1 font-semibold ${result.decision.allowed ? "text-emerald-300" : "text-rose-300"}`}>
                  {result.decision.allowed ? "ALLOWED" : "BLOCKED"}
                </p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-zinc-400">Reason</p>
                <p className="mt-1 text-zinc-200">{result.decision.reason}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <p className="text-zinc-400">Policy</p>
                <p className="mt-1 text-zinc-200">{result.decision.policy?.name || result.decision.policy?.id}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

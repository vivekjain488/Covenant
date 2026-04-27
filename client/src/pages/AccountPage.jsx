import { useState } from "react";
import { User, Trash2 } from "lucide-react";
import { useWallet } from "@/context/WalletContext";

export default function AccountPage() {
  const { address, chainId, workspace, updateWorkspace, isConnected } = useWallet();
  const [nickname, setNickname] = useState(workspace.profile.nickname || "");
  const [riskMode, setRiskMode] = useState(workspace.profile.riskMode || "moderate");
  const [message, setMessage] = useState("");

  function saveProfile(event) {
    event.preventDefault();

    updateWorkspace((current) => ({
      ...current,
      profile: {
        ...current.profile,
        nickname: nickname.trim(),
        riskMode,
      },
    }));

    setMessage("Profile saved to your wallet workspace.");
  }

  function clearWorkspace() {
    updateWorkspace({
      profile: {
        nickname: "",
        riskMode: "moderate",
      },
      personalPolicies: [],
      simulationHistory: [],
    });

    setNickname("");
    setRiskMode("moderate");
    setMessage("Workspace reset complete.");
  }

  return (
    <section className="space-y-5 py-4">
      <header className="guardrail-panel p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Account</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Personal isolated workspace</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Each connected wallet gets its own workspace snapshot for profile, policies, and simulation logs.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={saveProfile} className="guardrail-panel p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <User className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Profile settings</p>
          </div>

          <p className="text-sm text-zinc-400">Wallet: {isConnected ? address : "Not connected"}</p>
          <p className="text-sm text-zinc-400">Chain: {chainId || "unknown"}</p>

          <label className="block text-sm text-zinc-300">
            Nickname
            <input
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-white/20"
              placeholder="My GuardRail Agent"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Risk Mode
            <select
              value={riskMode}
              onChange={(event) => setRiskMode(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none focus:border-white/20"
            >
              <option value="conservative">Conservative</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Save Profile
          </button>

          {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
        </form>

        <div className="guardrail-panel p-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Workspace summary</p>
          <div className="mt-4 space-y-2 text-sm text-zinc-300">
            <p>Nickname: {workspace.profile.nickname || "(none)"}</p>
            <p>Risk mode: {workspace.profile.riskMode}</p>
            <p>Personal policies: {(workspace.personalPolicies || []).length}</p>
            <p>Simulation history: {(workspace.simulationHistory || []).length}</p>
          </div>

          <button
            type="button"
            onClick={clearWorkspace}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 transition-colors hover:bg-rose-500/20"
          >
            <Trash2 className="h-4 w-4" />
            Reset Workspace
          </button>
        </div>
      </div>
    </section>
  );
}

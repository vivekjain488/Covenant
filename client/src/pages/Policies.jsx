import { useState, useEffect } from "react";
import { useWallet } from "@/context/WalletContext";
import { fetchPolicies, createPolicy, compilePolicy, fetchPolicyVersions, rollbackPolicy } from "../lib/api";
import { Plus, CheckCircle2, Shield, Trash2, XCircle, Loader2, Sparkles, RotateCcw } from "lucide-react";

export default function Policies() {
  const { isConnected, address, workspace, updateWorkspace } = useWallet();
  const [serverPolicies, setServerPolicies] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [limitUSD, setLimitUSD] = useState("500");
  const [windowHours, setWindowHours] = useState("24");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [compilerInput, setCompilerInput] = useState("");
  const [compiledMessage, setCompiledMessage] = useState("");
  const [versionsByPolicy, setVersionsByPolicy] = useState({});

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      const data = await fetchPolicies();
      setServerPolicies(data.policies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadVersions = async (policyId) => {
    try {
      const data = await fetchPolicyVersions(policyId);
      setVersionsByPolicy((current) => ({ ...current, [policyId]: data.versions || [] }));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-zinc-600 mb-4" />
        <h2 className="text-xl font-semibold text-white">Wallet not connected</h2>
        <p className="text-zinc-400 mt-2 text-sm">Connect your wallet to create and manage firewall policies for your AI agents.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newPolicyName.trim()) return;
    setSubmitting(true);
    try {
      const limitWei = (BigInt(Math.round(parseFloat(limitUSD))) * 10n ** 18n).toString();
      const result = await createPolicy({
        name: newPolicyName,
        owner: address,
        limitWei,
        windowSeconds: parseInt(windowHours) * 3600,
        tags: ["custom", "user-created"],
      });

      // Also save locally
      updateWorkspace((draft) => ({
        ...draft,
        personalPolicies: [
          ...draft.personalPolicies,
          {
            id: result.policy.id,
            name: newPolicyName,
            status: "active",
            createdAt: new Date().toISOString(),
            rules: [{ action: "any", maxUSD: parseInt(limitUSD), perWindow: `${windowHours}h` }],
          },
        ],
      }));

      await loadPolicies();
      setNewPolicyName("");
      setLimitUSD("500");
      setWindowHours("24");
      setIsCreating(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLocal = (id) => {
    updateWorkspace((draft) => ({
      ...draft,
      personalPolicies: draft.personalPolicies.filter((p) => p.id !== id),
    }));
  };

  const handleCompilePolicy = async () => {
    if (!compilerInput.trim()) return;
    setSubmitting(true);
    setCompiledMessage("");
    try {
      const result = await compilePolicy(compilerInput, address || "0xCovenantAdmin");
      setCompiledMessage(`Compiled and saved as ${result.policy.id} v${result.policy.version}`);
      setCompilerInput("");
      await loadPolicies();
      await loadVersions(result.policy.id);
    } catch (err) {
      setCompiledMessage(err.message || "Compilation failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRollback = async (policyId, version) => {
    setSubmitting(true);
    try {
      await rollbackPolicy(policyId, version);
      await loadPolicies();
      await loadVersions(policyId);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const localPolicies = workspace?.personalPolicies || [];
  const allPolicies = [...localPolicies, ...serverPolicies.filter((sp) => !localPolicies.some((lp) => lp.id === sp.id))];

  return (
    <div className="relative z-10 text-white max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Agent Firewall Policies</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Define spending limits, token whitelists, and risk levels. Each policy guards one or more AI agents.
          </p>
        </div>
        {!isCreating && (
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5"
          >
            <Plus className="h-4 w-4" />
            Create Policy
          </button>
        )}
      </div>

      {isCreating && (
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6">
          <h2 className="text-lg font-medium text-emerald-300 mb-4">New Policy Definition</h2>
          <div className="grid gap-4 sm:grid-cols-3 mb-4">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 block">Policy Name</label>
              <input
                type="text"
                placeholder="e.g. trading-bot-rules"
                value={newPolicyName}
                onChange={(e) => setNewPolicyName(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/20 bg-black/50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 block">Max Spend (USD)</label>
              <input
                type="number"
                placeholder="500"
                value={limitUSD}
                onChange={(e) => setLimitUSD(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/20 bg-black/50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 mb-1 block">Time Window (hours)</label>
              <input
                type="number"
                placeholder="24"
                value={windowHours}
                onChange={(e) => setWindowHours(e.target.value)}
                className="w-full rounded-xl border border-emerald-500/20 bg-black/50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCreate}
              disabled={submitting}
              className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Deploy to Registry
            </button>
            <button
              onClick={() => setIsCreating(false)}
              className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-medium hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-cyan-300" />
          <h2 className="text-lg font-medium text-cyan-200">Natural Language Policy Compiler</h2>
        </div>
        <p className="mb-4 text-sm text-zinc-300">
          Write policy intent in plain English. Covenant compiles it into a typed runtime policy with deterministic defaults.
        </p>
        <textarea
          value={compilerInput}
          onChange={(e) => setCompilerInput(e.target.value)}
          placeholder="Example: This agent can spend up to 1 ETH per day on Uniswap for ETH/USDC only, never between 2-6 UTC, block new contracts under 30 days."
          className="min-h-[120px] w-full rounded-xl border border-cyan-500/20 bg-black/50 px-4 py-3 text-sm outline-none focus:border-cyan-500/50"
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleCompilePolicy}
            disabled={submitting}
            className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-cyan-300 disabled:opacity-50"
          >
            Compile + Save
          </button>
          {compiledMessage ? <p className="text-sm text-zinc-300">{compiledMessage}</p> : null}
        </div>
      </div>

      {loading ? (
        <div className="text-zinc-500 text-sm animate-pulse py-12 text-center">Loading policies from Covenant API...</div>
      ) : allPolicies.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-black/35 flex flex-col items-center justify-center py-20 text-center">
          <Shield className="h-10 w-10 text-zinc-600 mb-4" />
          <p className="text-sm text-zinc-400 mb-2">No active policies defined yet.</p>
          <p className="text-xs text-zinc-500 mb-4">Create your first policy to start protecting your AI agents.</p>
          <button
            onClick={() => setIsCreating(true)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Register your first policy
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {allPolicies.map((policy) => (
            <div
              key={policy.id}
              className="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border border-white/8 bg-black/35 p-6 transition-colors hover:border-white/15 hover:bg-white/[0.02]"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                    {policy.enabled === false ? (
                      <XCircle className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </span>
                  <h3 className="text-base font-medium text-white">{policy.name}</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {policy.rules
                    ? policy.rules.map((rule, idx) => (
                        <span key={idx} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.05em] text-zinc-400 font-mono">
                          {rule.action} / ${rule.maxUSD} / {rule.perWindow}
                        </span>
                      ))
                    : policy.limitWei && (
                        <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.05em] text-zinc-400 font-mono">
                          limit: {(BigInt(policy.limitWei) / 10n ** 18n).toString()} ETH / {policy.windowSeconds}s
                        </span>
                      )}
                  {policy.tags?.map((tag) => (
                    <span key={tag} className="rounded-md border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-cyan-400">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => loadVersions(policy.id)}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10"
                  >
                    Load Versions
                  </button>
                  {(versionsByPolicy[policy.id] || []).length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {versionsByPolicy[policy.id].slice(0, 3).map((versionEntry) => (
                        <div key={`${policy.id}-${versionEntry.version}`} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs text-zinc-300">
                          <span>v{versionEntry.version} · {new Date(versionEntry.timestamp).toLocaleString()}</span>
                          <button
                            onClick={() => handleRollback(policy.id, versionEntry.version)}
                            disabled={submitting}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-amber-300 hover:bg-amber-500/20"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Rollback
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                {policy.rules && (
                  <button
                    onClick={() => handleDeleteLocal(policy.id)}
                    className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label="Delete policy"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

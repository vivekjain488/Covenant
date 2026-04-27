import { useState } from "react";
import { useWallet } from "../context/WalletContext";
import { Plus, CheckCircle2, Shield, Trash2, ArrowRight } from "lucide-react";

export default function Policies() {
  const { isConnected, workspace, updateWorkspace } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [newPolicyName, setNewPolicyName] = useState("");

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Shield className="h-12 w-12 text-zinc-600 mb-4" />
        <h2 className="text-xl font-semibold text-white">Wallet not connected</h2>
        <p className="text-zinc-400 mt-2 text-sm">Please connect your wallet to view and edit your policies.</p>
      </div>
    );
  }

  const policies = workspace?.personalPolicies || [];

  const handleCreate = () => {
    if (!newPolicyName.trim()) return;
    
    updateWorkspace((draft) => ({
      ...draft,
      personalPolicies: [
        ...draft.personalPolicies,
        {
          id: Date.now().toString(),
          name: newPolicyName,
          status: "active",
          createdAt: new Date().toISOString(),
          rules: [
            { action: "swap", maxUSD: 500, perWindow: "1d", allowedProtocols: ["uniswap-v4"] }
          ]
        }
      ]
    }));
    
    setNewPolicyName("");
    setIsCreating(false);
  };

  const handleDelete = (id) => {
    updateWorkspace((draft) => ({
      ...draft,
      personalPolicies: draft.personalPolicies.filter(p => p.id !== id)
    }));
  };

  return (
    <div className="relative z-10 text-white max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">On-Chain Policies</h1>
          <p className="mt-2 text-sm text-zinc-400">Layer 1: View and manage ENS-registered JSON rule sets.</p>
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
        <div className="mb-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 animate-in fade-in slide-in-from-top-4">
          <h2 className="text-lg font-medium text-emerald-300 mb-4">New Policy Definition</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="e.g. trading-bot-rules"
              value={newPolicyName}
              onChange={(e) => setNewPolicyName(e.target.value)}
              className="flex-1 rounded-xl border border-emerald-500/20 bg-black/50 px-4 py-2.5 text-sm outline-none focus:border-emerald-500/50"
            />
            <button 
              onClick={handleCreate}
              className="rounded-xl bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
            >
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

      {policies.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-black/35 p-10 flex flex-col items-center justify-center py-20 text-center">
          <Shield className="h-10 w-10 text-zinc-600 mb-4" />
          <p className="text-sm text-zinc-400 mb-4">No active policies found for this workspace.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium hover:bg-white/10 transition-colors"
          >
            Register your first policy
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {policies.map(policy => (
            <div key={policy.id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-6 rounded-2xl border border-white/8 bg-black/35 p-6 transition-colors hover:border-white/15 hover:bg-white/[0.02]">
              <div>
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  </span>
                  <h3 className="text-base font-medium text-white">{policy.name}</h3>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {policy.rules.map((rule, idx) => (
                    <span key={idx} className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-[0.05em] text-zinc-400 font-mono">
                      {rule.action} / ${rule.maxUSD} / {rule.perWindow}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-transparent px-4 py-2 text-xs font-medium text-white hover:bg-white/5 transition-colors">
                  View Source <ArrowRight className="h-3 w-3" />
                </button>
                <button 
                  onClick={() => handleDelete(policy.id)}
                  className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-2 text-rose-400 hover:bg-rose-500/20 transition-colors opacity-0 group-hover:opacity-100"
                  aria-label="Delete policy"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

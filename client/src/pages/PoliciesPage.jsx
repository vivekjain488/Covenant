import { useMemo, useState } from "react";
import { Plus, Shield } from "lucide-react";
import { createPolicy } from "@/lib/api";
import { useWallet } from "@/context/WalletContext";

export default function PoliciesPage() {
  const { workspace, updateWorkspace, isConnected } = useWallet();
  const [form, setForm] = useState({
    id: "",
    name: "",
    limitWei: "1000000000000000000",
    windowSeconds: "3600",
  });
  const [message, setMessage] = useState("");

  const policies = useMemo(() => workspace.personalPolicies || [], [workspace.personalPolicies]);

  async function handleCreate(event) {
    event.preventDefault();

    if (!isConnected) {
      setMessage("Connect wallet first to create personal policies.");
      return;
    }

    if (!form.name.trim()) {
      setMessage("Policy name is required.");
      return;
    }

    const payload = {
      id: form.id.trim() || form.name.trim().toLowerCase().replace(/\s+/g, "-"),
      name: form.name.trim(),
      limitWei: form.limitWei.trim(),
      windowSeconds: Number.parseInt(form.windowSeconds, 10),
      enabled: true,
      tags: ["personal", "wallet"],
    };

    try {
      await createPolicy(payload);

      updateWorkspace((current) => ({
        ...current,
        personalPolicies: [{ ...payload, createdAt: new Date().toISOString() }, ...(current.personalPolicies || [])],
      }));

      setMessage("Policy created and pushed to backend.");
      setForm((current) => ({ ...current, id: "", name: "" }));
    } catch (createError) {
      setMessage(createError.message || "Could not create policy.");
    }
  }

  return (
    <section className="space-y-5 py-4">
      <header className="guardrail-panel p-6 md:p-8">
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Policy workspace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Create and manage personal guardrails</h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-400">
          Policies are isolated per wallet and persisted to local workspace storage while also posting to your backend.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <form onSubmit={handleCreate} className="guardrail-panel p-6 space-y-4">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <Plus className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">New policy</p>
          </div>

          <label className="block text-sm text-zinc-300">
            Policy Name
            <input
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none transition-colors focus:border-white/20"
              placeholder="Conservative Trading Policy"
            />
          </label>

          <label className="block text-sm text-zinc-300">
            Policy ID (optional)
            <input
              value={form.id}
              onChange={(event) => setForm((current) => ({ ...current, id: event.target.value }))}
              className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none transition-colors focus:border-white/20"
              placeholder="conservative-trading"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-zinc-300">
              Limit (wei)
              <input
                value={form.limitWei}
                onChange={(event) => setForm((current) => ({ ...current, limitWei: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none transition-colors focus:border-white/20"
              />
            </label>

            <label className="block text-sm text-zinc-300">
              Window Seconds
              <input
                value={form.windowSeconds}
                onChange={(event) => setForm((current) => ({ ...current, windowSeconds: event.target.value }))}
                className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm outline-none transition-colors focus:border-white/20"
              />
            </label>
          </div>

          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Save Policy
          </button>

          {message ? <p className="text-sm text-zinc-400">{message}</p> : null}
        </form>

        <div className="guardrail-panel p-6">
          <div className="inline-flex items-center gap-2 text-zinc-300">
            <Shield className="h-4 w-4" />
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Wallet policies</p>
          </div>

          <div className="mt-4 space-y-3">
            {policies.length === 0 ? (
              <p className="text-sm text-zinc-500">No personal policies yet. Create your first policy on the left.</p>
            ) : (
              policies.map((policy) => (
                <article key={`${policy.id}-${policy.createdAt || ""}`} className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                  <p className="text-sm font-semibold text-white">{policy.name}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-zinc-500">{policy.id}</p>
                  <div className="mt-3 grid gap-1 text-xs text-zinc-400">
                    <p>Limit: {policy.limitWei}</p>
                    <p>Window: {policy.windowSeconds}s</p>
                    <p>Created: {policy.createdAt ? new Date(policy.createdAt).toLocaleString() : "session"}</p>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

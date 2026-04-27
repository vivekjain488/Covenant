import { useState, useEffect } from "react";
import { useWallet } from "../context/WalletContext";
import { fetchEvents } from "../lib/api";
import { AlertTriangle, Clock, TerminalSquare, AlertCircle, RefreshCw } from "lucide-react";

export default function ThreatLogs() {
  const { isConnected } = useWallet();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await fetchEvents();
      setEvents(data.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, []);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertTriangle className="h-12 w-12 text-zinc-600 mb-4" />
        <h2 className="text-xl font-semibold text-white">Wallet not connected</h2>
        <p className="text-zinc-400 mt-2 text-sm">Please connect your wallet to view your violation logs.</p>
      </div>
    );
  }

  return (
    <div className="relative z-10 text-white max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Violation & Event Logs</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Every transaction checked by GuardRail is logged here. Blocked attempts are highlighted in red.
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); load(); }}
          className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {loading && events.length === 0 ? (
        <div className="text-zinc-500 text-sm animate-pulse py-12 text-center">Loading events from GuardRail API...</div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-white/8 bg-black/35 p-6 flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="h-10 w-10 text-zinc-600 mb-4" />
          <p className="text-sm text-zinc-400 mb-2">No events recorded yet.</p>
          <p className="text-xs text-zinc-500">Run the Live Demo simulation to generate threat events.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {events.map((event, idx) => {
            const isBlock = event.type === "BLOCK";
            const isAllow = event.type === "ALLOW";

            return (
              <div key={idx} className={`rounded-2xl border p-5 md:p-6 transition-colors hover:border-white/15 ${
                isBlock ? "border-rose-500/20 bg-rose-500/5" : "border-white/8 bg-black/35"
              }`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex gap-4">
                    <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      isBlock ? 'bg-rose-500/20 text-rose-400' :
                      isAllow ? 'bg-emerald-500/20 text-emerald-400' :
                      'bg-amber-500/20 text-amber-400'
                    }`}>
                      {isBlock ? <AlertCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className={`text-[11px] uppercase tracking-wider font-bold ${
                          isBlock ? 'text-rose-400' : isAllow ? 'text-emerald-400' : 'text-amber-400'
                        }`}>{event.type}</span>
                        {event.policyId && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wider text-zinc-400">
                            {event.policyId}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-zinc-300">{event.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {event.time}</span>
                        {event.amountWei && (
                          <span className="flex items-center gap-1.5">
                            <TerminalSquare className="h-3.5 w-3.5" /> 
                            {(BigInt(event.amountWei) / 10n ** 18n).toString()} ETH
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

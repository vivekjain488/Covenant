import { Outlet, NavLink, Link } from "react-router-dom";
import { useWallet } from "@/context/WalletContext";
import { Shield, Home, ListChecks, AlertTriangle, PlayCircle, FlaskConical, LogOut, PlugZap, UserCircle2 } from "lucide-react";

export default function DashboardLayout() {
  const { address, disconnectWallet, isConnected, isConnecting, connectWallet } = useWallet();

  const truncateAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-white/8 bg-black/50 p-6 flex flex-col justify-between backdrop-blur-xl z-10">
        <div>
          <Link to="/" className="flex items-center gap-3 mb-10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04]">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">Covenant</p>
              <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Dashboard</p>
            </div>
          </Link>

          <nav className="space-y-2">
            {[
              { path: "/app", icon: Home, label: "Overview", exact: true },
              { path: "/app/policies", icon: ListChecks, label: "Policies" },
              { path: "/app/studio", icon: FlaskConical, label: "Agent Studio" },
              { path: "/app/threats", icon: AlertTriangle, label: "Threat Logs" },
              { path: "/app/demo", icon: PlayCircle, label: "Live Demo" },
              { path: "/app/integrations", icon: PlugZap, label: "Integrations" },
              { path: "/app/account", icon: UserCircle2, label: "Account" },
            ].map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-zinc-200"
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          {isConnected ? (
            <div className="flex flex-col gap-3">
              <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4 text-center">
                <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500 mb-1">Connected Wallet</p>
                <p className="font-mono text-sm tracking-tight text-emerald-400">{truncateAddress(address)}</p>
              </div>
              <button
                onClick={disconnectWallet}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-transform hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="ml-64 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/8 bg-black/50 px-8 backdrop-blur-xl">
          <p className="text-sm font-medium text-zinc-400">
            Covenant Protocol Workspace
          </p>
          <div className="flex items-center gap-4">
            {isConnected ? (
              <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Network Connected
              </span>
            ) : (
              <span className="flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs text-rose-300">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                Read-only mode
              </span>
            )}
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="aurora aurora-left opacity-30" />
        <div className="aurora aurora-right opacity-30" />
        <div className="grid-noise" />
      </div>
    </div>
  );
}

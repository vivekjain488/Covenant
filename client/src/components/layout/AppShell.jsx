import { Shield, LayoutDashboard, SlidersHorizontal, FlaskConical, PlugZap, UserCircle2 } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import ConnectWalletButton from "@/components/wallet/ConnectWalletButton";

const navItems = [
  { to: "/", label: "Home", icon: Shield, end: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/policies", label: "Policies", icon: SlidersHorizontal },
  { to: "/studio", label: "Agent Studio", icon: FlaskConical },
  { to: "/integrations", label: "Integrations", icon: PlugZap },
  { to: "/account", label: "Account", icon: UserCircle2 },
];

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="aurora aurora-left" />
        <div className="aurora aurora-right" />
        <div className="grid-noise" />
      </div>

      <header className="sticky top-4 z-30 mx-auto mt-4 flex w-[min(1200px,calc(100%-1.5rem))] items-center justify-between rounded-full border border-white/8 bg-black/60 px-3 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">GuardRail</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">Agent Firewall</p>
          </div>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] p-1 lg:flex">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm transition-colors ${
                    isActive ? "bg-white text-black" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <ConnectWalletButton />
      </header>

      <main className="relative z-10 mx-auto w-[min(1200px,calc(100%-1.5rem))] pb-16 pt-8">
        <Outlet />
      </main>
    </div>
  );
}

import { Shield } from "lucide-react";

export function Navbar() {
  return (
    <div className="fixed top-6 inset-x-0 z-[100] flex justify-center px-4 pointer-events-none">
      <nav className="pointer-events-auto flex items-center justify-between w-full max-w-5xl rounded-full border border-white/10 bg-black/40 px-6 py-3 backdrop-blur-xl shadow-2xl transition-all hover:bg-black/50">
        <a href="/" className="flex items-center gap-2 text-white transition-opacity hover:opacity-80">
          <Shield className="h-5 w-5 text-cyan-400" />
          <span className="font-semibold tracking-tight">Covenant</span>
        </a>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-300">
          <a href="#architecture" className="hover:text-white transition-colors">Architecture</a>
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="/app/integrations" className="hover:text-white transition-colors">Integrations</a>
          <a href="/app/demo" className="hover:text-white transition-colors">Live Demo</a>
        </div>
        
        <div className="flex items-center gap-4">
          <a
            href="/app"
            className="rounded-full bg-cyan-500/10 border border-cyan-500/30 px-5 py-2 text-sm font-semibold text-cyan-50 transition-all hover:bg-cyan-500 hover:text-black hover:scale-105 active:scale-95"
          >
            Launch App
          </a>
        </div>
      </nav>
    </div>
  );
}

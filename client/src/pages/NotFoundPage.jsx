import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#050505] py-10 text-white">
      <div className="covenant-panel max-w-xl p-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Route not found</h1>
        <p className="mt-4 text-sm text-zinc-400">The page you opened is not part of the Covenant app routes.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Landing
          </Link>
          <Link
            to="/app"
            className="inline-flex rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </section>
  );
}

import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center py-10">
      <div className="guardrail-panel max-w-xl p-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.28em] text-zinc-500">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Route not found</h1>
        <p className="mt-4 text-sm text-zinc-400">The page you opened is not part of the GuardRail app routes.</p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          Return Home
        </Link>
      </div>
    </section>
  );
}

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowRight, Shield } from "lucide-react";
import { fetchState } from "@/lib/api";
import { ArchitectureFlow } from "@/components/landing/ArchitectureFlow";
import { FeatureDeck } from "@/components/landing/FeatureDeck";
import { Navbar } from "@/components/landing/Navbar";

gsap.registerPlugin(ScrollTrigger);

const INTRO_STORAGE_KEY = "covenant_landing_intro_v1";
const INTRO_MAX_MS = 7000;

const HERO_TITLE = "Covenant gates capital before autonomy touches it.";
const SUBTITLE_LINES = [
  "Operational trust for agents that quote markets, reconcile treasuries, or answer wallet prompts.",
  "Clear allow or deny, with receipts your team can reconcile—without taking custody.",
];

function readIntroSkipped() {
  if (typeof window === "undefined") {
    return true;
  }
  try {
    return sessionStorage.getItem(INTRO_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export default function Landing() {
  const rootRef = useRef(null);
  const heroRef = useRef(null);
  const introWrapRef = useRef(null);
  const introFadeRef = useRef(null);
  const videoRef = useRef(null);
  const introDismissed = useRef(false);

  const [state, setState] = useState(null);
  const [introDone, setIntroDone] = useState(() => {
    if (typeof window === "undefined") {
      return true;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return true;
    }
    return readIntroSkipped();
  });

  useEffect(() => {
    if (introDone) {
      return undefined;
    }

    const wrap = introWrapRef.current;
    const video = videoRef.current;
    const fade = introFadeRef.current;
    if (!wrap || !video) {
      return undefined;
    }

    const finalize = () => {
      if (introDismissed.current) {
        return;
      }
      introDismissed.current = true;
      try {
        sessionStorage.setItem(INTRO_STORAGE_KEY, "1");
      } catch {
        /* private mode */
      }
      setIntroDone(true);
    };

    const fadeOut = () => {
      const tl = gsap.timeline({ onComplete: finalize });
      tl.to(video, { opacity: 0, duration: 0.42, ease: "power2.in" }, 0);
      if (fade) {
        tl.to(fade, { opacity: 1, duration: 0.62, ease: "power2.inOut" }, 0.1);
      } else {
        tl.to(wrap, { backgroundColor: "#000000", duration: 0.5 }, 0.1);
      }
    };

    const maxTimer = window.setTimeout(() => fadeOut(), INTRO_MAX_MS);

    const onEnded = () => {
      window.clearTimeout(maxTimer);
      fadeOut();
    };

    video.addEventListener("ended", onEnded);
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        window.clearTimeout(maxTimer);
        fadeOut();
      });
    }

    return () => {
      window.clearTimeout(maxTimer);
      video.removeEventListener("ended", onEnded);
    };
  }, [introDone]);

  useLayoutEffect(() => {
    if (!introDone) {
      return undefined;
    }

    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || !heroRef.current) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      const words = heroRef.current.querySelectorAll("[data-split-word]");
      const blurLines = heroRef.current.querySelectorAll("[data-hero-blur-in]");
      const ctas = heroRef.current.querySelectorAll(".landing-cta");
      gsap.set(words, { opacity: 0, y: 28, rotateX: -8, transformPerspective: 800 });
      gsap.set(blurLines, { opacity: 0, y: 12, filter: "blur(10px)" });
      gsap.set(ctas, { opacity: 0, y: 16 });
      gsap.to(words, {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.75,
        ease: "power3.out",
        stagger: 0.045,
      });
      gsap.to(blurLines, {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration: 0.85,
        delay: 0.1,
        ease: "power2.out",
        stagger: 0.12,
      });
      gsap.to(ctas, {
        opacity: 1,
        y: 0,
        duration: 0.5,
        delay: 0.28,
        ease: "power3.out",
        stagger: 0.08,
      });
      gsap.from(".js-landing-architecture", {
        scrollTrigger: { trigger: ".js-landing-architecture", start: "top 82%" },
        y: 32,
        opacity: 0,
        duration: 0.75,
        ease: "power3.out",
      });
      gsap.from(".js-landing-metrics-row", {
        scrollTrigger: { trigger: ".js-landing-metrics-row", start: "top 90%" },
        y: 20,
        opacity: 0,
        duration: 0.55,
        ease: "power2.out",
      });
      gsap.from(".js-landing-feature-col", {
        scrollTrigger: { trigger: ".js-landing-features", start: "top 82%" },
        y: 30,
        opacity: 0,
        duration: 0.68,
        ease: "power3.out",
        stagger: 0.1,
      });
    }, rootRef);

    return () => ctx.revert();
  }, [introDone]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const s = await fetchState();
        if (!cancelled) {
          setState(s);
        }
      } catch {
        if (!cancelled) {
          setState(null);
        }
      }
    };
    load();
    const interval = setInterval(load, 6000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const metrics = state?.metrics;
  const metricItems = [
    { label: "Policies", value: metrics?.policiesEnforced ?? "—", hint: "Enforced today" },
    { label: "Checks", value: metrics?.totalChecks ?? "—", hint: "Evaluations" },
    { label: "Blocked", value: metrics?.transactionsBlocked ?? "—", hint: "Stopped at the gate" },
    { label: "Median latency", value: metrics?.medianCheckMs ? `${metrics.medianCheckMs} ms` : "—", hint: "Typical decision" },
  ];

  return (
    <div ref={rootRef} className="bg-black text-white">
      {!introDone ? (
        <div
          ref={introWrapRef}
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black"
          role="status"
          aria-live="polite"
          aria-label="Loading Covenant experience"
        >
          <video
            ref={videoRef}
            src="/loader.mp4"
            className="relative z-[1] h-full w-full object-cover md:object-contain"
            muted
            playsInline
            autoPlay
            preload="auto"
          />
          <div
            ref={introFadeRef}
            className="pointer-events-none absolute inset-0 z-[2] bg-black opacity-0"
            aria-hidden
          />
          <p className="absolute bottom-10 left-0 right-0 z-[3] text-center text-[10px] uppercase tracking-[0.45em] text-cyan-500/60">
            Initializing covenant mesh
          </p>
        </div>
      ) : null}

      <Navbar />

      {/* Hero: circuit GIF + fade to pure black below — GIF does not extend past this section */}
      <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-black">
        <div className="pointer-events-none absolute inset-0 overflow-hidden bg-black">
          <img
            src="/bg-gif.gif"
            alt=""
            className="landing-circuit-gif absolute left-1/2 top-[42%] h-[115%] w-[120%] max-w-none -translate-x-1/2 -translate-y-1/2 object-cover opacity-[0.38] mix-blend-screen saturate-[1.08]"
            decoding="async"
          />
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_90%_55%_at_50%_12%,rgba(56,189,248,0.2),transparent_58%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent via-45% to-black"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[38%] via-black via-[76%] to-black" aria-hidden />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black to-transparent" aria-hidden />

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center justify-center px-4 py-20 text-center lg:px-6">
          <header ref={heroRef} className="flex max-w-4xl flex-col items-center" style={{ perspective: "1200px" }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-cyan-200/85 backdrop-blur-md">
              <Shield className="h-4 w-4" aria-hidden />
              Covenant Protocol
            </div>

            <h1 className="mt-8 max-w-4xl text-4xl font-bold tracking-tight text-white md:text-6xl lg:text-7xl [&_[data-split-word]]:will-change-transform [&_[data-split-word]]:drop-shadow-[0_0_28px_rgba(56,189,248,0.12)]">
              {HERO_TITLE.split(" ").map((word, i) => (
                <span key={`${word}-${i}`} data-split-word className="mr-[0.16em] inline-block origin-bottom">
                  {word}
                </span>
              ))}
            </h1>

            <div className="mt-8 max-w-2xl space-y-4 text-[15px] leading-relaxed text-zinc-300 md:text-lg">
              {SUBTITLE_LINES.map((line, i) => (
                <p key={i} data-hero-blur-in>
                  {line}
                </p>
              ))}
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
              <a
                href="/app"
                className="landing-cta inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-8 py-3.5 text-sm font-semibold text-black shadow-[0_0_32px_rgba(34,211,238,0.28)] transition-[filter] hover:brightness-110"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
              <a
                href="/app/demo"
                className="landing-cta inline-flex items-center justify-center rounded-full border border-cyan-400/35 bg-black/35 px-8 py-3.5 text-sm font-medium text-cyan-50 backdrop-blur-sm transition-colors hover:border-cyan-300/55 hover:bg-cyan-500/10"
              >
                Run Attack Replay
              </a>
              <a
                href="/app/integrations"
                className="landing-cta inline-flex items-center justify-center rounded-full border border-white/12 bg-black/25 px-8 py-3.5 text-sm text-zinc-200 backdrop-blur-sm transition-colors hover:border-white/25"
              >
                Integrations
              </a>
            </div>
          </header>
        </div>
      </section>

      <main className="relative bg-black">
        <div className="mx-auto w-[min(1120px,calc(100%-1.5rem))] space-y-0 px-4 pb-28 pt-4 md:px-6">
          <section id="architecture" className="js-landing-architecture border-t border-white/[0.06] pt-20">
            <ArchitectureFlow />
          </section>

          <div id="features">
            <FeatureDeck className="mt-28" />
          </div>

          <section className="js-landing-metrics-row mt-28 border-y border-white/[0.07] py-16">
            <div className="flex flex-wrap items-center justify-center gap-y-12 gap-x-12 text-center md:gap-x-24">
              {metricItems.map((m) => (
                <div key={m.label} className="min-w-[140px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-500/80">{m.label}</p>
                  <p className="mt-3 text-4xl font-bold tabular-nums text-white md:text-5xl">{m.value}</p>
                  <p className="mt-2 text-xs text-zinc-500">{m.hint}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

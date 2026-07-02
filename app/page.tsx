"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { EngineMetrics, BetaKeyStats } from "@/types";

// ── Scroll reveal ─────────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("is-revealed"); obs.disconnect(); } },
      { threshold: 0.06 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function FadeIn({ children, className, delay }: {
  children: React.ReactNode;
  className?: string;
  delay?: 100 | 150 | 200 | 300 | 400;
}) {
  const ref = useReveal();
  return (
    <div ref={ref} data-reveal data-delay={delay} className={className}>
      {children}
    </div>
  );
}

// ── Poster mosaic ─────────────────────────────────────────────────────────────

const POSTERS: [string, string][] = [
  ["#12111f","#1e1b3a"],["#1f1112","#3a1b1e"],["#111f12","#1b3a1e"],["#1f1d11","#3a3217"],
  ["#11113d","#1e1e5a"],["#1f112d","#3a1b48"],["#002240","#003a5a"],["#2a1808","#4a2c10"],
  ["#0e1f2e","#1a3050"],["#1f0e2a","#381848"],["#0e2014","#183820"],["#251a0e","#423016"],
  ["#14001e","#2a0050"],["#001814","#003028"],["#1a0e0e","#381818"],["#0f1a28","#1c3048"],
  ["#221a0e","#3e3016"],["#1a220e","#2e3c14"],["#1a0014","#380028"],["#00140e","#002e1e"],
  ["#200e0e","#3a1414"],["#0e0e22","#1a1a3e"],["#22140e","#3e2414"],["#0e2214","#183c1e"],
];

function HeroMosaic() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0" style={{ perspective: "1000px" }}>
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "repeat(6, 1fr)",
            width: "135%",
            marginLeft: "-17.5%",
            marginTop: "-2%",
            transform: "rotateX(20deg) rotateZ(-3deg) scale(1.08)",
            transformOrigin: "top center",
            opacity: 0.2,
          }}
        >
          {POSTERS.map(([from, to], i) => (
            <div
              key={i}
              className="flex-shrink-0 rounded-[8px]"
              style={{
                aspectRatio: "2/3",
                background: `linear-gradient(155deg, ${from} 0%, ${to} 100%)`,
                animationDelay: `${(i * 137) % 2000}ms`,
              }}
            />
          ))}
        </div>
      </div>
      {/* Gradients d'estompage */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/50 via-bg-primary/70 to-bg-primary" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/80 via-transparent to-bg-primary/80" />
      {/* Vignette cinéma */}
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, transparent 0%, rgba(10,19,13,0.4) 100%)"
      }} />
    </div>
  );
}

// ── App mockup ────────────────────────────────────────────────────────────────

const ROW_COLORS: [string, string][] = [
  ["#1a1a2e","#0f3460"],["#2e1a1a","#5a1515"],["#1a2e1a","#153d15"],
  ["#2e2a1a","#4a3810"],["#1a1a3e","#20206a"],["#2e1a2e","#4a154a"],
  ["#001a2e","#00304a"],["#2e1808","#5a2a08"],["#0a1a2e","#1a2d4a"],
  ["#200a2e","#3a1050"],["#0a2010","#183520"],["#2a1a0a","#4a2e10"],
  ["#10001a","#30005a"],["#001810","#003020"],["#1a0a0a","#4a1010"],
];

function AppMockup() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl px-4">
      <div className="absolute -inset-4 -bottom-10 rounded-[28px] bg-accent/6 blur-3xl" aria-hidden />
      <div className="absolute -inset-4 -bottom-10 rounded-[28px] bg-secondary/4 blur-2xl" aria-hidden />

      <div className="relative overflow-hidden rounded-[18px] border border-white/[0.08] shadow-[0_40px_100px_rgba(0,0,0,0.7)] backdrop-blur-sm"
        style={{ background: "rgba(10,19,13,0.6)" }}>
        {/* Barre fenêtre */}
        <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3"
          style={{ background: "rgba(255,255,255,0.025)" }}>
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-error/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
          </div>
          <div className="mx-auto flex h-6 items-center gap-2 rounded-full px-4" style={{ background: "rgba(255,255,255,0.05)" }}>
            <svg className="h-2.5 w-2.5 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="text-[10px] text-text-secondary/50">swipefilm.app</span>
          </div>
        </div>

        {/* Nav app interne */}
        <div className="flex items-center justify-between border-b border-white/[0.05] px-6 py-2.5" style={{ background: "rgba(17,30,20,0.7)" }}>
          <span className="font-display text-sm font-bold text-text-primary">Swipe<span className="text-secondary">Film</span></span>
          <div className="flex gap-5">
            <span className="text-[11px] font-semibold text-secondary">Recommandations</span>
            <span className="text-[11px] text-text-secondary/70">Swipe</span>
            <span className="text-[11px] text-text-secondary/70">Compte</span>
          </div>
        </div>

        {/* Hero banner */}
        <div className="relative h-32 overflow-hidden" style={{ background: "linear-gradient(135deg, #0d1b4b, #162555, #1e3a8a)" }}>
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/95 via-bg-primary/30 to-transparent" />
          <div className="absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 3px,rgba(255,255,255,0.08) 3px,rgba(255,255,255,0.08) 6px)" }} />
          <div className="absolute bottom-4 left-6">
            <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.2em] text-secondary">Recommandé pour toi • 94%</p>
            <p className="font-display text-lg font-bold leading-tight text-text-primary">The Prestige</p>
            <p className="text-[10px] text-text-secondary/70">Christopher Nolan · 2006 · 130 min</p>
          </div>
          <div className="absolute bottom-4 right-6 flex gap-2">
            <button className="h-8 w-8 flex items-center justify-center rounded-full border border-swipe-skip/50 bg-swipe-skip/10">
              <svg className="h-3.5 w-3.5 text-swipe-skip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
            <button className="h-8 w-8 flex items-center justify-center rounded-full border border-swipe-like/50 bg-swipe-like/10">
              <svg className="h-3.5 w-3.5 text-swipe-like" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
            </button>
          </div>
        </div>

        {/* Rangées */}
        <div className="space-y-5 bg-bg-primary p-5 pb-6">
          {[
            { label: "Pour vous", offset: 0 },
            { label: "Trésors cachés · Films sous-estimés", offset: 5 },
            { label: "Parce que tu as aimé The Prestige", offset: 10 },
          ].map((row) => (
            <div key={row.label}>
              <p className="mb-2.5 px-0.5 text-[10px] font-semibold text-text-primary">{row.label}</p>
              <div className="flex gap-1.5 overflow-hidden">
                {Array.from({ length: 7 }).map((_, i) => {
                  const [from, to] = ROW_COLORS[(row.offset + i) % ROW_COLORS.length];
                  return (
                    <div key={i} className="flex-shrink-0 rounded-[5px] transition-transform hover:scale-[1.03]"
                      style={{ width: "50px", aspectRatio: "2/3", background: `linear-gradient(145deg, ${from}, ${to})` }} />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Swipe deck animé ──────────────────────────────────────────────────────────

const DEMO_CARDS = [
  { title: "The Prestige", year: "2006", director: "Christopher Nolan", duration: "130 min", score: "94", genres: ["Thriller", "Mystère"], bg: "from-[#0d1b4b] via-[#162555] to-[#1e3a8a]" },
  { title: "Spirited Away", year: "2001", director: "Hayao Miyazaki", duration: "125 min", score: "97", genres: ["Animation", "Fantastique"], bg: "from-[#0d3b2c] via-[#135e46] to-[#1a7a5e]" },
  { title: "No Country for Old Men", year: "2007", director: "Coen Brothers", duration: "122 min", score: "91", genres: ["Thriller", "Crime"], bg: "from-[#3b1a05] via-[#6b2d08] to-[#8b3a0a]" },
  { title: "Mulholland Drive", year: "2001", director: "David Lynch", duration: "147 min", score: "89", genres: ["Mystère", "Drame"], bg: "from-[#1a052a] via-[#2d0a4a] to-[#3a0d5a]" },
];

function SwipeDeck() {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out-right" | "out-left" | "in">("idle");
  const [action, setAction] = useState<"like" | "skip" | null>(null);

  useEffect(() => {
    const t = setInterval(() => {
      const isLike = Math.random() > 0.4;
      setAction(isLike ? "like" : "skip");
      setPhase(isLike ? "out-right" : "out-left");
      setTimeout(() => {
        setIdx((i) => (i + 1) % DEMO_CARDS.length);
        setPhase("in");
        setAction(null);
        setTimeout(() => setPhase("idle"), 440);
      }, 380);
    }, 4000);
    return () => clearInterval(t);
  }, []);

  const card = DEMO_CARDS[idx];
  const anim =
    phase === "out-right" ? "card-out-right 0.38s cubic-bezier(0.4,0,1,1) forwards"
    : phase === "out-left"  ? "card-out-left 0.38s cubic-bezier(0.4,0,1,1) forwards"
    : phase === "in"        ? "card-in 0.44s cubic-bezier(0.22,1,0.36,1) forwards"
    : "card-float 4s ease-in-out infinite";

  return (
    <div className="relative flex justify-center select-none pb-20">
      {/* Cartes empilées en arrière */}
      <div className="absolute left-6 top-5 h-[360px] w-56 rounded-[18px] border border-white/[0.06] bg-white/[0.015] opacity-25 rotate-[4deg]" />
      <div className="absolute left-3 top-2.5 h-[360px] w-56 rounded-[18px] border border-white/[0.05] bg-white/[0.01] opacity-50 rotate-[1.5deg]" />

      {/* Carte principale */}
      <div style={{ animation: anim, position: "relative" }}>
        {/* Feedback overlay */}
        {action && (
          <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-[18px] ${
            action === "like" ? "bg-swipe-like/20 border-2 border-swipe-like/60" : "bg-swipe-skip/20 border-2 border-swipe-skip/60"
          }`}>
            {action === "like"
              ? <svg className="h-16 w-16 text-swipe-like drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
              : <svg className="h-16 w-16 text-swipe-skip drop-shadow-lg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            }
          </div>
        )}

        <div className="w-56 overflow-hidden rounded-[18px] border border-white/[0.09] shadow-2xl backdrop-blur-sm"
          style={{ background: "rgba(10,19,13,0.5)" }}>
          {/* Poster */}
          <div className={`relative h-72 bg-gradient-to-br ${card.bg}`}>
            <div className="absolute inset-0 opacity-[0.06]"
              style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.05) 2px,rgba(255,255,255,0.05) 4px)" }} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-transparent" />
            <div className="absolute top-3 right-3 rounded-[6px] bg-secondary px-2 py-0.5 text-[11px] font-bold text-bg-primary">{card.score}%</div>
            <div className="absolute top-3 left-3 rounded-full bg-success/90 px-2.5 py-0.5 text-[10px] font-semibold text-bg-primary">Dispo</div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-primary/98 via-bg-primary/60 to-transparent px-4 pb-3 pt-10">
              <p className="font-display text-sm font-bold leading-snug text-text-primary">{card.title}</p>
              <p className="mt-0.5 text-[10px] text-text-secondary/80">{card.year} · {card.director}</p>
            </div>
          </div>
          {/* Infos */}
          <div className="p-3.5 pt-3">
            <p className="text-xs text-text-secondary/70">{card.duration}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              {card.genres.map((g) => (
                <span key={g} className="rounded-full border border-secondary/25 bg-secondary/8 px-2 py-0.5 text-[10px] font-medium text-secondary">{g}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Boutons */}
      <div className="absolute bottom-0 flex gap-8">
        <button aria-label="Passer" className="cursor-pointer flex h-14 w-14 items-center justify-center rounded-full border-2 border-swipe-skip/40 bg-swipe-skip/8 shadow-lg transition-all hover:scale-110 hover:bg-swipe-skip/20">
          <svg className="h-6 w-6 text-swipe-skip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
        <button aria-label="J'aime" className="cursor-pointer flex h-14 w-14 items-center justify-center rounded-full border-2 border-swipe-like/40 bg-swipe-like/8 shadow-lg transition-all hover:scale-110 hover:bg-swipe-like/20">
          <svg className="h-6 w-6 text-swipe-like" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Intégrations marquee ──────────────────────────────────────────────────────

const INTEGRATIONS = [
  { name: "Jellyfin",   color: "#00A4DC", bg: "rgba(0,164,220,0.12)",  letter: "J" },
  { name: "Plex",       color: "#E5A00D", bg: "rgba(229,160,13,0.12)", letter: "P" },
  { name: "Seerr",      color: "#4a9eda", bg: "rgba(74,158,218,0.12)", letter: "S" },
  { name: "TMDB",       color: "#01D277", bg: "rgba(1,210,119,0.12)",  letter: "T" },
  { name: "Radarr",     color: "#F5C518", bg: "rgba(245,197,24,0.12)", letter: "R" },
  { name: "Sonarr",     color: "#35c5f4", bg: "rgba(53,197,244,0.12)", letter: "S" },
  { name: "Jellyseerr", color: "#8B5CF6", bg: "rgba(139,92,246,0.12)", letter: "J" },
];

function IntegrationsBadge({ p }: { p: typeof INTEGRATIONS[0] }) {
  return (
    <div className="flex flex-col items-center gap-2 mx-5 flex-shrink-0">
      <div className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-white/[0.08] text-lg font-bold transition-all hover:scale-105 hover:border-white/20"
        style={{ color: p.color, background: p.bg }}
        aria-label={p.name}>
        {p.letter}
      </div>
      <span className="text-xs text-text-secondary/70">{p.name}</span>
    </div>
  );
}

function IntegrationsMarquee() {
  const doubled = [...INTEGRATIONS, ...INTEGRATIONS, ...INTEGRATIONS];
  return (
    <div className="relative overflow-hidden py-6">
      <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-bg-primary to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-bg-primary to-transparent pointer-events-none" />
      <div className="flex items-end" style={{ animation: "marquee 20s linear infinite", width: "max-content" }}>
        {doubled.map((p, i) => <IntegrationsBadge key={i} p={p} />)}
      </div>
    </div>
  );
}

// ── Icônes ────────────────────────────────────────────────────────────────────

function IcoServer() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" /></svg>; }
function IcoSwipe() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>; }
function IcoSparkle() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>; }
function IcoShield() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>; }
function IcoFilm() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" /></svg>; }
function IcoKey() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" /></svg>; }
function IcoCheck() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>; }
function IcoX() { return <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>; }

// ── CountUp ───────────────────────────────────────────────────────────────────

function CountUp({ target, duration = 1400 }: { target: number; duration?: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const p = Math.min((Date.now() - start) / duration, 1);
      setValue(Math.floor(target * (1 - Math.pow(1 - p, 3))));
      if (p >= 1) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <>{value}</>;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { token, _hasHydrated } = useAppStore();
  const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
  const [betaStats, setBetaStats] = useState<BetaKeyStats | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const isLoggedIn = _hasHydrated && !!token;

  function ctaHref() { return isLoggedIn ? "/recommendations" : "/onboarding"; }
  function handleCta(e: React.MouseEvent) { e.preventDefault(); router.push(ctaHref()); }

  useEffect(() => {
    api.get<EngineMetrics>("/api/metrics/engine", { skipAuth: true }).then(setMetrics).catch(() => {});
    api.get<BetaKeyStats>("/api/metrics/beta-keys", { skipAuth: true }).then(setBetaStats).catch(() => {});
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── NAVBAR ── */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? "border-b border-white/[0.08] shadow-[0_4px_32px_rgba(0,0,0,0.4)]" : "border-b border-transparent"
      } backdrop-blur-xl`} style={{ background: scrolled ? "rgba(10,19,13,0.92)" : "rgba(10,19,13,0.6)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="select-none font-display text-xl font-bold tracking-tight text-text-primary">
            Swipe<span className="text-secondary">Film</span>
          </span>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/recommendations"
                className="cursor-pointer rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.97]">
                Mes recommandations →
              </Link>
            ) : (
              <>
                <span className="hidden rounded-full border border-secondary/35 bg-secondary/8 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-secondary sm:flex">
                  Beta fermée
                </span>
                <Link href="/onboarding"
                  className="cursor-pointer rounded-[10px] bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.97]">
                  Rejoindre →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden pb-0 pt-28">
          <HeroMosaic />

          {/* Grain cinéma */}
          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.035] mix-blend-overlay"
            style={{ animation: "grain-drift 8s steps(1) infinite" }}>
            <filter id="hero-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#hero-grain)" />
          </svg>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/8 px-4 py-1.5">
              <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
                {betaStats
                  ? `Beta fermée · ${betaStats.remainingSlots} places restantes`
                  : "Beta fermée · Accès sur invitation"}
              </span>
            </div>

            {/* Accroche */}
            <p className="mx-auto mb-4 max-w-md text-base font-medium text-text-secondary">
              Tu as des centaines de films sur ton serveur.{" "}
              <span className="text-text-primary">Ce soir, tu sais lequel regarder.</span>
            </p>

            {/* Titre */}
            <h1 className="font-display text-5xl font-bold leading-[1.1] text-text-primary md:text-6xl lg:text-7xl">
              Tinder pour ta<br />
              <em className="not-italic" style={{
                background: "linear-gradient(135deg, var(--color-accent) 0%, var(--color-secondary) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>médiathèque perso.</em>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-text-secondary">
              SwipeFilm connecte ton <strong className="text-text-primary font-semibold">Jellyfin</strong> ou
              ton <strong className="text-text-primary font-semibold">Plex</strong>, apprend tes goûts à chaque swipe
              et te recommande exactement ce qu'il te faut — depuis ta propre bibliothèque.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <button onClick={handleCta}
                className="cursor-pointer rounded-[10px] bg-primary px-9 py-4 text-base font-semibold text-text-primary shadow-[0_0_32px_rgba(160,53,48,0.4)] transition-all hover:brightness-110 hover:shadow-[0_0_40px_rgba(160,53,48,0.55)] active:scale-[0.97]">
                {isLoggedIn ? "Voir mes recommandations →" : "Rejoindre la beta →"}
              </button>
              <a href="#how"
                className="cursor-pointer rounded-[10px] border border-white/[0.1] bg-white/[0.04] px-9 py-4 text-base font-medium text-text-secondary backdrop-blur-sm transition-all hover:bg-white/[0.08] hover:text-text-primary">
                Comment ça marche
              </a>
            </div>

            {/* Compatibilité */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs text-text-secondary/60">
              {["Jellyfin", "Plex", "Seerr"].map((s) => (
                <span key={s} className="rounded-full border border-white/[0.08] bg-white/[0.025] px-3 py-1 font-medium">{s}</span>
              ))}
              <span className="mx-1 text-text-secondary/30">·</span>
              <span>100% self-hosted · Gratuit · Open-source</span>
            </div>

            {/* Stats */}
            <div className="mt-14 flex flex-wrap items-center justify-center gap-10 md:gap-20">
              {[
                { value: betaStats?.activeKeys ?? "—", label: "testeurs actifs" },
                { value: betaStats?.remainingSlots ?? "—", label: "places restantes", highlight: true },
                { value: metrics?.totalSwipes != null ? metrics.totalSwipes.toLocaleString("fr-FR") : "—", label: "swipes collectés" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`font-display text-4xl font-bold tabular-nums ${s.highlight ? "text-secondary" : "text-text-primary"}`}>
                    {s.value}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* App mockup */}
          <AppMockup />
        </section>

        {/* ── INTÉGRATIONS ── */}
        <section className="py-14">
          <FadeIn className="mx-auto max-w-6xl px-6 text-center mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary/50">
              Fonctionne avec ta stack self-hosted
            </p>
          </FadeIn>
          <IntegrationsMarquee />
        </section>

        {/* ── CONFIDENTIALITÉ ── */}
        <section className="py-24" style={{ background: "var(--color-surface)" }}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-14 lg:grid-cols-2">
              <FadeIn>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">Privacy first</p>
                <h2 className="font-display text-4xl font-bold text-text-primary">
                  Pas de compte traceable.<br />Pas de données perso.
                </h2>
                <p className="mt-4 max-w-sm leading-relaxed text-text-secondary">
                  On est en beta — on demande juste <strong className="text-text-primary">un email</strong> pour
                  éviter les abus. Pas de newsletter, pas de tracking, jamais.
                </p>
                <p className="mt-3 max-w-sm leading-relaxed text-text-secondary">
                  Après l'import, tu reçois une <strong className="font-semibold text-secondary">clé unique XXXX-YYYY</strong>.
                  C'est ton seul identifiant — non rattachable à une identité réelle.
                </p>
                <button onClick={handleCta}
                  className="cursor-pointer mt-7 inline-block rounded-[10px] bg-primary px-7 py-3.5 text-sm font-semibold text-text-primary transition-all hover:brightness-110 active:scale-[0.97]">
                  {isLoggedIn ? "Accéder à mes recommandations →" : "Demander l'accès →"}
                </button>
              </FadeIn>

              <div className="space-y-3">
                {[
                  { icon: <IcoKey />, title: "Clé XXXX-YYYY — ton seul identifiant", desc: "Note-la. Elle ne peut pas être retrouvée via ton email ni liée à une identité réelle.", color: "text-secondary border-secondary/20 bg-secondary/6" },
                  { icon: <IcoShield />, title: "Connexion via Jellyfin / Plex", desc: "Tu te connectes avec tes identifiants existants. Aucun nouveau mot de passe.", color: "text-success border-success/20 bg-success/6", delay: 100 },
                  { icon: <IcoFilm />, title: "Tes fichiers restent sur ton serveur", desc: "SwipeFilm ne stocke que les métadonnées TMDB et tes swipes anonymisés.", color: "text-secondary border-secondary/20 bg-secondary/6", delay: 200 },
                  { icon: <IcoServer />, title: "100% self-hosted · Gratuit", desc: "Pas de SaaS, pas de freemium. Un outil open-source comme Jellyfin.", color: "text-warning border-warning/20 bg-warning/6", delay: 300 },
                ].map((item) => (
                  <FadeIn key={item.title} delay={item.delay as 100 | 200 | 300 | undefined}>
                    <div className="group flex gap-4 rounded-[14px] border border-white/[0.06] p-4 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.03]"
                      style={{ background: "rgba(255,255,255,0.02)" }}>
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[10px] border transition-transform group-hover:scale-105 ${item.color}`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{item.desc}</p>
                      </div>
                    </div>
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── AVANT / APRÈS ── */}
        <section className="py-24">
          <div className="mx-auto max-w-5xl px-6">
            <FadeIn className="mb-14 text-center">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">La différence</p>
              <h2 className="font-display text-4xl font-bold text-text-primary">Fini le scrolling infini.</h2>
              <p className="mx-auto mt-3 max-w-md text-text-secondary">
                Contrairement à Trakt ou Letterboxd, SwipeFilm sait ce qui est déjà sur <em>ton</em> serveur.
              </p>
            </FadeIn>
            <div className="grid gap-5 md:grid-cols-2">
              <FadeIn delay={100}>
                <div className="h-full rounded-[18px] border border-error/20 p-7" style={{ background: "rgba(224,85,85,0.03)" }}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-error/30 bg-error/10 text-error"><IcoX /></div>
                    <p className="font-semibold text-text-secondary">Avant SwipeFilm</p>
                  </div>
                  <ul className="space-y-3.5">
                    {[
                      "Tu scrolles ta bibliothèque pendant 30 minutes",
                      "Tu sais pas quoi choisir, tu remets Netflix",
                      "Tu re-regardes des films déjà vus",
                      "Letterboxd recommande des films pas dispo chez toi",
                      "Ton historique Jellyfin sert à rien",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3 text-sm text-text-secondary">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error/50" aria-hidden />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
              <FadeIn delay={200}>
                <div className="h-full rounded-[18px] border border-secondary/20 p-7" style={{ background: "rgba(212,169,74,0.03)" }}>
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success"><IcoCheck /></div>
                    <p className="font-semibold text-text-primary">Avec SwipeFilm</p>
                  </div>
                  <ul className="space-y-3.5">
                    {[
                      "Un film à la fois — décision en 5 secondes",
                      "Le moteur apprend de chaque swipe ce que tu aimes",
                      "Recommandations depuis ta bibliothèque, pas un catalogue externe",
                      "Film pas dispo ? Demande-le via Seerr en un clic",
                      "Ton historique Jellyfin devient le carburant du moteur",
                    ].map((t) => (
                      <li key={t} className="flex items-start gap-3 text-sm text-text-primary">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-secondary" aria-hidden />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── PITCH 3 COLONNES ── */}
        <section className="py-20" style={{ background: "var(--color-surface)" }}>
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: <IcoServer />, title: "Ton serveur, tes règles", desc: "SwipeFilm lit ta bibliothèque Jellyfin ou Plex. Pas de cloud, pas de données tierces. Tout reste chez toi.", color: "text-secondary border-secondary/20 bg-secondary/6", delay: 100 },
                { icon: <IcoSwipe />, title: "Un film à la fois", desc: "Droite = intéressé, gauche = pas pour moi. Plus tu swipes, plus le moteur te connaît. Décision en secondes.", color: "text-accent border-accent/20 bg-accent/6", delay: 200 },
                { icon: <IcoSparkle />, title: "Le moteur apprend de toi", desc: "Tu notes chaque suggestion de 1 à 10. On mesure si le moteur pense comme toi. Il s'affine à chaque session.", color: "text-secondary border-secondary/20 bg-secondary/6", delay: 300 },
              ].map((c) => (
                <FadeIn key={c.title} delay={c.delay as 100 | 200 | 300}>
                  <div className="group h-full rounded-[18px] border border-white/[0.06] p-7 backdrop-blur-sm transition-all hover:border-white/[0.12] hover:bg-white/[0.02]"
                    style={{ background: "rgba(255,255,255,0.02)" }}>
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[12px] border transition-transform group-hover:scale-105 ${c.color}`}>{c.icon}</div>
                    <h3 className="mt-5 font-display text-xl font-semibold text-text-primary">{c.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{c.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── SWIPE + ÉTAPES ── */}
        <section id="how" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-20 lg:grid-cols-2">
              <FadeIn className="order-2 flex justify-center lg:order-1" delay={100}>
                <SwipeDeck />
              </FadeIn>
              <FadeIn className="order-1 lg:order-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">Comment ça marche</p>
                <h2 className="font-display text-4xl font-bold text-text-primary">Chaque swipe<br />entraîne le moteur</h2>
                <p className="mt-4 leading-relaxed text-text-secondary">
                  Le moteur calcule un score de pertinence selon ton profil. Tu le notes de 1 à 10.
                  Il apprend de l'écart entre sa prédiction et ta note.
                </p>
                <div className="mt-8 space-y-5">
                  {[
                    { step: "01", title: "Connecte ta bibliothèque", desc: "Entre l'URL + clé API de ton Jellyfin. L'import prend moins d'une minute.", cls: "text-secondary border-secondary/30 bg-secondary/8" },
                    { step: "02", title: "Swipe tes films", desc: "Droite = intéressé · Gauche = pas pour moi. Un film à la fois.", cls: "text-success border-success/30 bg-success/8" },
                    { step: "03", title: "Note la suggestion (1→10)", desc: "Note obligatoire à chaque swipe. C'est ce qui calibre le moteur.", cls: "text-warning border-warning/30 bg-warning/8" },
                    { step: "04", title: "Reçois tes recommandations", desc: "Sections Netflix-style générées depuis ta propre bibliothèque.", cls: "text-secondary border-secondary/30 bg-secondary/8" },
                  ].map((item) => (
                    <div key={item.step} className="group flex gap-4 items-start">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border text-xs font-bold transition-transform group-hover:scale-105 ${item.cls}`}>{item.step}</span>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{item.title}</p>
                        <p className="mt-0.5 text-sm text-text-secondary">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </FadeIn>
            </div>
          </div>
        </section>

        {/* ── SECTIONS RECO ── */}
        <section className="py-20" style={{ background: "var(--color-surface)" }}>
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">Recommandations</p>
              <h2 className="font-display text-4xl font-bold text-text-primary">Ton Netflix perso,<br />depuis tes propres films.</h2>
              <p className="mt-3 max-w-lg text-text-secondary">
                L'accueil génère plusieurs rangées de suggestions, chacune avec une logique différente.
              </p>
            </FadeIn>
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Pour vous", desc: "Recommandations personnalisées basées sur ton profil complet", delay: 100 },
                { label: "Trésors cachés", desc: "Films sous-estimés, bien notés, peu populaires", delay: 150 },
                { label: "Parce que tu as aimé…", desc: "Basé sur ton dernier coup de cœur", delay: 200 },
                { label: "Tes acteurs préférés", desc: "Déduit automatiquement de ton historique", delay: 300 },
                { label: "Tes réalisateurs", desc: "Calculé sur tes habitudes de visionnage", delay: 100 },
                { label: "Sorties récentes", desc: "Les nouveautés qui correspondent à tes goûts", delay: 150 },
                { label: "Découverte du jour", desc: "Cache régénéré chaque jour, qualité garantie", delay: 200 },
                { label: "Surprise-moi", desc: "Sélection aléatoire avec seuil de qualité minimum", delay: 300 },
              ].map((s) => (
                <FadeIn key={s.label} delay={s.delay as 100 | 150 | 200 | 300}>
                  <div className="group h-full rounded-[12px] border border-white/[0.06] p-4 backdrop-blur-sm transition-all hover:border-secondary/25 hover:bg-secondary/[0.03]"
                    style={{ background: "rgba(255,255,255,0.015)" }}>
                    <p className="text-sm font-semibold text-text-primary group-hover:text-secondary transition-colors">{s.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── MOTEUR / MÉTRIQUES ── */}
        <section className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">Sous le capot</p>
              <h2 className="font-display text-4xl font-bold text-text-primary">Le moteur sait<br />quand il se trompe.</h2>
              <p className="mt-3 max-w-lg text-text-secondary">
                À chaque swipe tu notes la suggestion. On compare ta note au score prédit.
                Plus les deux se rapprochent, mieux le moteur te connaît.
              </p>
            </FadeIn>
            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Alignement", sub: "Pearson", desc: "Tes goûts vs les prédictions. Proche de 1 = le moteur pense comme toi.", value: metrics?.pearsonCorrelation != null ? metrics.pearsonCorrelation.toFixed(3) : "—", color: "text-secondary", border: "border-secondary/15", glow: "rgba(212,169,74,0.08)" },
                { label: "Écart moyen", sub: "MAE", desc: "Différence entre ce que le moteur prédit et ce que tu notes.", value: metrics?.mae != null ? metrics.mae.toFixed(2) : "—", color: "text-error", border: "border-error/15", glow: "rgba(224,85,85,0.08)" },
                { label: "Optimisme", sub: "Biais", desc: "+ = trop confiant · − = trop prudent.", value: metrics?.bias != null ? (metrics.bias >= 0 ? "+" : "") + metrics.bias.toFixed(2) : "—", color: "text-text-primary", border: "border-white/8", glow: "transparent" },
                { label: "Calibration", sub: "Progression", desc: "Volume de données vers des recommandations fiables.", value: metrics?.coldStartProgress != null ? `${Math.round(metrics.coldStartProgress * 100)}%` : "—", color: "text-success", border: "border-success/15", glow: "rgba(74,222,128,0.08)" },
              ].map((m, i) => (
                <FadeIn key={m.sub} delay={([100, 200, 300, 400] as const)[i]}>
                  <div className="group h-full rounded-[18px] border p-6 backdrop-blur-sm transition-all hover:brightness-110"
                    style={{ background: `rgba(17,30,20,0.5)`, borderColor: m.border.replace("border-", ""), boxShadow: `inset 0 0 40px ${m.glow}` }}>
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{m.label}</p>
                    <p className="mt-0.5 text-[10px] text-text-secondary/40">{m.sub}</p>
                    <p className={`font-display mt-3 text-3xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
                    <p className="mt-3 text-xs leading-relaxed text-text-secondary">{m.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
            {metrics?.totalSwipes != null && (
              <FadeIn className="mt-5">
                <div className="rounded-[14px] border border-white/[0.06] px-6 py-4" style={{ background: "rgba(255,255,255,0.015)" }}>
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Progression collective vers la fiabilité</span>
                    <span className="font-medium tabular-nums text-text-primary">
                      {metrics.totalSwipes.toLocaleString("fr-FR")} / {metrics.swipesForReliableMetrics.toLocaleString("fr-FR")} swipes
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-full rounded-full bg-secondary transition-all duration-1000"
                      style={{ width: `${Math.min(100, (metrics.totalSwipes / (metrics.swipesForReliableMetrics || 1)) * 100)}%` }} />
                  </div>
                </div>
              </FadeIn>
            )}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="relative overflow-hidden py-28 text-center">
          {/* Gradient diagonal */}
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(160,53,48,0.12) 0%, rgba(212,169,74,0.06) 50%, transparent 100%)"
          }} aria-hidden />
          <div className="absolute inset-0 border-y border-white/[0.04]" style={{ background: "var(--color-surface)" }} />
          <div className="absolute inset-0" style={{
            background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(160,53,48,0.12) 0%, rgba(212,169,74,0.06) 50%, transparent 100%)"
          }} />

          <FadeIn className="relative mx-auto max-w-lg px-6">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/8 px-4 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary" style={{ animation: "pulse-dot 2s ease-in-out infinite" }} aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
                {betaStats ? `${betaStats.remainingSlots} places restantes` : "Accès limité"}
              </span>
            </div>
            <h2 className="font-display text-4xl font-bold text-text-primary md:text-5xl">
              Ce soir,<br />tu sais quoi regarder.
            </h2>
            <p className="mt-4 text-text-secondary">
              Connecte ta bibliothèque Jellyfin ou Plex, reçois ta clé unique — et commence à swiper dans la minute.
            </p>
            <button onClick={handleCta}
              className="cursor-pointer mt-9 inline-block rounded-[10px] bg-primary px-12 py-4.5 text-base font-semibold text-text-primary shadow-[0_0_40px_rgba(160,53,48,0.5)] transition-all hover:brightness-110 hover:shadow-[0_0_60px_rgba(160,53,48,0.65)] active:scale-[0.97]">
              {isLoggedIn ? "Voir mes recommandations →" : "Rejoindre la beta →"}
            </button>
            <p className="mt-5 text-xs text-text-secondary/60">
              {isLoggedIn
                ? "Tu es connecté · Swipe, découvre, profite."
                : "Un email pour éviter les abus · Clé unique XXXX-YYYY · Aucun mot de passe SwipeFilm"}
            </p>
          </FadeIn>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.05] py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="select-none font-display text-lg font-bold text-text-primary">
                Swipe<span className="text-secondary">Film</span>
              </span>
              <span className="ml-2 text-xs text-text-secondary/40">beta v0.1</span>
              <p className="mt-1 text-xs text-text-secondary/50">Tinder pour ta médiathèque perso.</p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="flex flex-wrap gap-2">
                {["ASP.NET Core", "PostgreSQL", "Jellyfin", "Plex", "TMDB", "Seerr"].map((t) => (
                  <span key={t} className="rounded-full border border-white/[0.06] px-3 py-1 text-xs text-text-secondary/60">{t}</span>
                ))}
              </div>
              <p className="text-xs text-text-secondary/30">100% self-hosted · open-source · privacy first</p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

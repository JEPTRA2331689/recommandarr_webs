"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAppStore } from "@/lib/store";
import type { EngineMetrics, BetaKeyStats } from "@/types";

// ── Types TMDB ────────────────────────────────────────────────────────────────

type TmdbCast = { name: string; photo: string | null };

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  year: string;
  poster: string | null;
  backdrop: string | null;
  score: number;
  genres: string[];
  cast: TmdbCast[];
};

// ── Hook TMDB landing ─────────────────────────────────────────────────────────

function useTmdbMovies() {
  const [movies, setMovies] = useState<TmdbMovie[]>([]);
  useEffect(() => {
    const lang = navigator.language || "en-US";
    fetch(`/api/tmdb/landing?language=${encodeURIComponent(lang)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data: TmdbMovie[]) => setMovies(data))
      .catch(() => {});
  }, []);
  return movies;
}

// ── Scroll reveal ─────────────────────────────────────────────────────────────

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add("is-revealed"); obs.disconnect(); } },
      { threshold: 0.08 }
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

// ── Fallback gradients (si pas de clé TMDB) ───────────────────────────────────

const POSTER_PAIRS: [string, string][] = [
  ["#1a1a2e", "#0f3460"], ["#2e1a1a", "#6b2020"], ["#1a2e1a", "#1a4020"],
  ["#2e2a1a", "#5a4010"], ["#1a1a3e", "#20206a"], ["#2e1a2e", "#4a154a"],
  ["#001a2e", "#003050"], ["#2e1808", "#5a2a08"], ["#0a1a2e", "#1a2d4a"],
  ["#200a2e", "#3a1050"], ["#0a2010", "#153520"], ["#2a1a0a", "#4a2e10"],
  ["#10001a", "#30005a"], ["#001810", "#003020"], ["#1a0a0a", "#4a1010"],
  ["#0f1a25", "#1a3040"], ["#251a0f", "#4a3010"], ["#1a250f", "#2a4015"],
];

// ── Hero mosaic ───────────────────────────────────────────────────────────────

function HeroMosaic({ movies }: { movies: TmdbMovie[] }) {
  const cells = Array.from({ length: 18 }, (_, i) =>
    movies.length > 0 ? movies[i % movies.length]?.poster ?? null : null
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="absolute inset-0 flex items-start justify-center pt-8" style={{ perspective: "900px" }}>
        <div
          className="grid gap-2 opacity-[0.22]"
          style={{
            gridTemplateColumns: "repeat(6, 1fr)",
            width: "130%",
            marginLeft: "-15%",
            transform: "rotateX(22deg) rotateZ(-4deg) scale(1.1)",
            transformOrigin: "top center",
          }}
        >
          {cells.map((posterUrl, i) => (
            <div key={i} className="rounded-[6px] flex-shrink-0 overflow-hidden" style={{ aspectRatio: "2/3" }}>
              {posterUrl ? (
                <img src={posterUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
              ) : (
                <div
                  className="h-full w-full"
                  style={{ background: `linear-gradient(145deg, ${POSTER_PAIRS[i % POSTER_PAIRS.length][0]}, ${POSTER_PAIRS[i % POSTER_PAIRS.length][1]})` }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-b from-bg-primary/55 via-bg-primary/75 to-bg-primary" />
      <div className="absolute inset-0 bg-gradient-to-r from-bg-primary/70 via-transparent to-bg-primary/70" />
    </div>
  );
}

// ── App mockup ────────────────────────────────────────────────────────────────

const SECTION_COLORS: [string, string][] = [
  ["#1a1a2e", "#0f3460"], ["#2e1a1a", "#5a1515"], ["#1a2e1a", "#153d15"],
  ["#2e2a1a", "#4a3810"], ["#1a1a3e", "#20206a"], ["#2e1a2e", "#4a154a"],
  ["#001a2e", "#00304a"], ["#2e1808", "#5a2a08"], ["#0a1a2e", "#1a2d4a"],
  ["#200a2e", "#3a1050"], ["#0a2010", "#183520"], ["#2a1a0a", "#4a2e10"],
  ["#10001a", "#30005a"], ["#001810", "#003020"], ["#1a0a0a", "#4a1010"],
];

function AppMockup({ firstMovie, allMovies }: { firstMovie?: TmdbMovie; allMovies: TmdbMovie[] }) {
  const heroTitle = firstMovie?.title ?? "The Prestige";
  const heroScore = firstMovie ? `${firstMovie.score}%` : "94%";

  return (
    <div className="relative mx-auto mt-20 max-w-4xl px-4">
      <div className="absolute -inset-4 -bottom-8 rounded-[24px] bg-accent/8 blur-3xl" aria-hidden />
      <div className="absolute -inset-4 -bottom-8 rounded-[24px] bg-secondary/5 blur-2xl" aria-hidden />

      <div className="relative overflow-hidden rounded-[16px] border border-white/[0.09] bg-white/[0.025] shadow-[0_32px_80px_rgba(0,0,0,0.6)] backdrop-blur-sm">
        {/* Barre fenêtre */}
        <div className="flex items-center gap-3 border-b border-white/[0.07] bg-white/[0.03] px-4 py-3">
          <div className="flex gap-1.5" aria-hidden>
            <div className="h-2.5 w-2.5 rounded-full bg-error/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-warning/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-success/50" />
          </div>
          <div className="mx-auto flex h-6 items-center gap-1.5 rounded-full bg-white/[0.05] px-4">
            <svg className="h-2.5 w-2.5 text-text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <span className="text-[10px] text-text-secondary/60">recommandarr.app</span>
          </div>
        </div>

        {/* Navbar in-app */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-surface/70 px-6 py-2.5">
          <span className="font-display text-sm font-bold text-text-primary">
            Recomm<span className="text-secondary">andarr</span>
          </span>
          <div className="flex gap-4">
            <span className="text-[11px] font-medium text-secondary">Recommandations</span>
            <span className="text-[11px] text-text-secondary">Swipe</span>
          </div>
          <span className="rounded-full border border-border px-3 py-0.5 text-[10px] text-text-secondary">Compte</span>
        </div>

        {/* Hero banner */}
        <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460]">
          {firstMovie?.backdrop && (
            <img
              src={firstMovie.backdrop}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-40"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary/90 to-transparent" />
          <div className="absolute bottom-4 left-6">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-secondary mb-1">Recommandé pour toi</p>
            <p className="font-display text-base font-bold text-text-primary">{heroTitle}</p>
          </div>
          <span className="absolute top-3 right-4 rounded-[4px] bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-bg-primary">{heroScore}</span>
        </div>

        {/* Rangées */}
        <div className="space-y-4 bg-bg-primary p-4 pb-5">
          {[
            { label: "Pour vous", startIdx: 0 },
            { label: "Trésors cachés", startIdx: 5 },
            { label: firstMovie ? `Parce que tu as aimé ${firstMovie.title}` : "Parce que tu as aimé The Prestige", startIdx: 10 },
          ].map((row) => (
            <div key={row.label}>
              <p className="mb-2 px-1 text-[10px] font-semibold text-text-primary truncate">{row.label}</p>
              <div className="flex gap-1.5 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => {
                  const movie = allMovies.length > 0 ? allMovies[(row.startIdx + i) % allMovies.length] : null;
                  const [from, to] = SECTION_COLORS[(row.startIdx + i) % SECTION_COLORS.length];
                  return movie?.poster ? (
                    <img
                      key={i}
                      src={movie.poster}
                      alt=""
                      className="flex-shrink-0 rounded-[4px] object-cover"
                      style={{ width: "52px", aspectRatio: "2/3" }}
                    />
                  ) : (
                    <div
                      key={i}
                      className="flex-shrink-0 rounded-[4px]"
                      style={{ width: "52px", aspectRatio: "2/3", background: `linear-gradient(145deg, ${from}, ${to})` }}
                    />
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

// ── SwipeDeck ─────────────────────────────────────────────────────────────────

type DemoCard = {
  title: string; year: string; score: number | string;
  genres: string[]; poster?: string | null; backdrop?: string | null;
  overview?: string; cast?: TmdbCast[]; bg?: string;
};

const FALLBACK_CARDS: DemoCard[] = [
  { title: "The Prestige",          year: "2006", score: "94", genres: ["Thriller", "Mystère"],    bg: "from-[#0d1b4b] via-[#162555] to-[#1e3a8a]" },
  { title: "Spirited Away",         year: "2001", score: "97", genres: ["Animation", "Fantastique"], bg: "from-[#0d3b2c] via-[#135e46] to-[#1a7a5e]" },
  { title: "No Country for Old Men",year: "2007", score: "91", genres: ["Thriller", "Crime"],      bg: "from-[#3b1a05] via-[#6b2d08] to-[#8b3a0a]" },
];

function SwipeDeck({ movies: tmdbMovies }: { movies: TmdbMovie[] }) {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle");

  const cards: DemoCard[] = tmdbMovies.length > 0 ? tmdbMovies : FALLBACK_CARDS;

  useEffect(() => {
    const t = setInterval(() => {
      setPhase("out");
      setTimeout(() => {
        setIdx((i) => (i + 1) % cards.length);
        setPhase("in");
        setTimeout(() => setPhase("idle"), 440);
      }, 370);
    }, 3800);
    return () => clearInterval(t);
  }, [cards.length]);

  const card = cards[idx % cards.length];
  const anim =
    phase === "out" ? "card-out 0.37s cubic-bezier(0.4,0,1,1) forwards"
    : phase === "in"  ? "card-in 0.44s cubic-bezier(0.22,1,0.36,1) forwards"
    : "card-float 3.4s ease-in-out infinite";

  return (
    <div className="relative flex justify-center select-none pb-16" aria-hidden>
      <div className="absolute left-5 top-5 h-[360px] w-52 rounded-[16px] border border-white/[0.07] bg-white/[0.02] opacity-30 rotate-3" />
      <div className="absolute left-2.5 top-2.5 h-[360px] w-52 rounded-[16px] border border-white/[0.06] bg-white/[0.015] opacity-55 rotate-1" />

      <div style={{ animation: anim }}>
        <div className="w-52 overflow-hidden rounded-[16px] border border-white/[0.09] bg-surface shadow-2xl backdrop-blur-sm">
          {/* Poster / Backdrop */}
          <div className="relative h-64 overflow-hidden bg-surface-alt">
            {card.poster ? (
              <img src={card.poster} alt={card.title} className="h-full w-full object-cover" />
            ) : card.backdrop ? (
              <img src={card.backdrop} alt={card.title} className="h-full w-full object-cover" />
            ) : (
              <div className={`h-full w-full bg-gradient-to-br ${card.bg ?? "from-surface to-surface-alt"}`}>
                <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "repeating-linear-gradient(45deg,transparent,transparent 2px,rgba(255,255,255,0.05) 2px,rgba(255,255,255,0.05) 4px)" }} />
              </div>
            )}
            <span className="absolute top-3 right-3 rounded-[5px] bg-secondary px-2 py-0.5 text-[11px] font-bold text-bg-primary">{card.score}%</span>
            <span className="absolute top-3 left-3 rounded-full bg-success/90 px-2.5 py-0.5 text-[10px] font-semibold text-bg-primary">Dispo</span>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-bg-primary/95 via-bg-primary/50 to-transparent px-4 pb-2.5 pt-8">
              <p className="font-display text-sm font-bold leading-snug text-text-primary">{card.title}</p>
            </div>
          </div>

          {/* Infos */}
          <div className="p-3">
            <p className="text-xs text-text-secondary">{card.year} · {card.genres?.slice(0, 2).join(" · ")}</p>

            {card.overview && (
              <p className="mt-1.5 text-[10px] leading-relaxed text-text-secondary/80 line-clamp-2">{card.overview}</p>
            )}

            {/* Acteurs */}
            {(card.cast?.length ?? 0) > 0 ? (
              <div className="mt-2 flex items-center gap-1">
                {card.cast!.slice(0, 4).map((actor) =>
                  actor.photo ? (
                    <img
                      key={actor.name}
                      src={actor.photo}
                      alt={actor.name}
                      title={actor.name}
                      className="h-7 w-7 flex-shrink-0 rounded-full border border-white/[0.15] object-cover"
                    />
                  ) : (
                    <div
                      key={actor.name}
                      className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.1] bg-surface-alt text-[9px] text-text-secondary"
                      title={actor.name}
                    >
                      {actor.name[0]}
                    </div>
                  )
                )}
                {card.cast![0] && (
                  <span className="ml-0.5 max-w-[80px] truncate text-[9px] text-text-secondary/60">
                    {card.cast![0].name}
                  </span>
                )}
              </div>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1">
                {card.genres.map((g) => (
                  <span key={g} className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[10px] font-medium text-secondary">{g}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="absolute -bottom-2 flex gap-6">
        <button aria-label="Passer" className="cursor-pointer flex h-14 w-14 items-center justify-center rounded-full border-2 border-swipe-skip/50 bg-swipe-skip/10 transition-colors hover:bg-swipe-skip/20">
          <svg className="h-6 w-6 text-swipe-skip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
        </button>
        <button aria-label="J'aime" className="cursor-pointer flex h-14 w-14 items-center justify-center rounded-full border-2 border-swipe-like/50 bg-swipe-like/10 transition-colors hover:bg-swipe-like/20">
          <svg className="h-6 w-6 text-swipe-like" fill="currentColor" viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Intégrations avec vrais logos ─────────────────────────────────────────────

const INTEGRATIONS = [
  { name: "Jellyfin",   slug: "jellyfin",          color: "#00A4DC" },
  { name: "Plex",       slug: "plex",               color: "#E5A00D" },
  { name: "Overseerr",  slug: "overseerr",          color: "#E4A34A" },
  { name: "TMDB",       slug: "themoviedatabase",   color: "#01D277" },
  { name: "Radarr",     slug: "radarr",             color: "#FFC230" },
  { name: "Sonarr",     slug: "sonarr",             color: "#35C5F4" },
] as const;

function IntegrationLogo({ p }: { p: typeof INTEGRATIONS[number] }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-[14px] border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm transition-colors hover:bg-white/[0.07]"
        aria-label={p.name}
      >
        {!failed ? (
          <img
            src={`https://cdn.simpleicons.org/${p.slug}/${p.color.slice(1)}`}
            alt={p.name}
            className="h-8 w-8"
            loading="lazy"
            onError={() => setFailed(true)}
          />
        ) : (
          <span className="text-lg font-bold" style={{ color: p.color }}>{p.name[0]}</span>
        )}
      </div>
      <span className="text-xs text-text-secondary">{p.name}</span>
    </div>
  );
}

// ── Icônes ────────────────────────────────────────────────────────────────────

function IcoServer() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 0 1-3-3m3 3a3 3 0 1 0 0 6h13.5a3 3 0 1 0 0-6m-16.5-3a3 3 0 0 1 3-3h13.5a3 3 0 0 1 3 3m-19.5 0a4.5 4.5 0 0 1 .9-2.7L5.737 5.1a3.375 3.375 0 0 1 2.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 0 1 .9 2.7m0 0a3 3 0 0 1-3 3m0 3h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Zm-3 6h.008v.008h-.008v-.008Zm0-6h.008v.008h-.008v-.008Z" /></svg>; }
function IcoSwipe() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>; }
function IcoSparkle() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" /></svg>; }
function IcoShield() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>; }
function IcoFilm() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" /></svg>; }
function IcoKey() { return <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" /></svg>; }
function IcoCheck() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>; }
function IcoX() { return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>; }

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { token, _hasHydrated } = useAppStore();
  const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
  const [betaStats, setBetaStats] = useState<BetaKeyStats | null>(null);

  const tmdbMovies = useTmdbMovies();
  const isLoggedIn = _hasHydrated && !!token;

  function ctaHref() { return isLoggedIn ? "/recommendations" : "/onboarding"; }
  function ctaLabel(loggedIn: string, guest: string) { return isLoggedIn ? loggedIn : guest; }
  function handleCta(e: React.MouseEvent) { e.preventDefault(); router.push(ctaHref()); }

  useEffect(() => {
    api.get<EngineMetrics>("/api/metrics/engine", { skipAuth: true }).then(setMetrics).catch(() => {});
    api.get<BetaKeyStats>("/api/metrics/beta-keys", { skipAuth: true }).then(setBetaStats).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen">

      {/* ── NAVBAR ── */}
      <header className="sticky top-0 z-50 border-b border-white/[0.06] backdrop-blur-xl" style={{ background: "var(--color-nav-bg)" }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="select-none font-display text-xl font-bold tracking-tight text-text-primary">
            Recomm<span className="text-secondary">andarr</span>
          </span>
          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link href="/recommendations" className="cursor-pointer rounded-[8px] bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:brightness-110 active:brightness-90">
                Mes recommandations →
              </Link>
            ) : (
              <>
                <span className="hidden rounded-full border border-secondary/40 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-secondary sm:flex">
                  Beta fermée
                </span>
                <Link href="/onboarding" className="cursor-pointer rounded-[8px] bg-primary px-5 py-2.5 text-sm font-semibold text-text-primary transition-colors hover:brightness-110 active:brightness-90">
                  Rejoindre →
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main>

        {/* ── HERO ── */}
        <section className="relative overflow-hidden pb-0 pt-24">
          <HeroMosaic movies={tmdbMovies} />

          <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04] mix-blend-overlay" style={{ animation: "grain-drift 8s steps(1) infinite" }}>
            <filter id="hero-grain">
              <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#hero-grain)" />
          </svg>

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-secondary" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
                {betaStats ? `Beta fermée · ${betaStats.remainingSlots} places restantes` : "Beta fermée · Places limitées"}
              </span>
            </div>

            <p className="mx-auto mb-3 max-w-md text-base font-medium text-text-secondary">
              Tu as des centaines de films sur ton serveur.{" "}
              <span className="text-text-primary">Ce soir, tu sais lequel regarder.</span>
            </p>

            <h1 className="font-display text-5xl font-bold leading-tight text-text-primary md:text-6xl lg:text-7xl">
              Tinder pour ta<br />
              <em className="not-italic text-accent">médiathèque perso.</em>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-text-secondary">
              Recommandarr connecte ton <strong className="text-text-primary">Jellyfin</strong> ou
              ton <strong className="text-text-primary">Plex</strong>, apprend tes goûts à chaque swipe,
              et te recommande exactement ce qu'il te faut — depuis ta propre bibliothèque.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
              <button onClick={handleCta} className="cursor-pointer rounded-[8px] bg-primary px-8 py-4 text-base font-semibold text-text-primary transition-colors hover:brightness-110 active:brightness-90">
                {ctaLabel("Voir mes recommandations →", "Rejoindre la beta →")}
              </button>
              <a href="#how" className="cursor-pointer rounded-[8px] border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-base font-medium text-text-secondary backdrop-blur-sm transition-colors hover:bg-white/[0.07] hover:text-text-primary">
                Comment ça marche
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-2 text-xs text-text-secondary">
              {["Jellyfin", "Plex", "Overseerr"].map((s) => (
                <span key={s} className="rounded-full border border-white/[0.1] bg-white/[0.03] px-3 py-1 font-medium backdrop-blur-sm">{s}</span>
              ))}
              <span className="mx-1 text-text-secondary/30">·</span>
              <span className="text-text-secondary/60">100% self-hosted · Gratuit · Open-source</span>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 md:gap-14">
              {[
                { value: betaStats?.activeKeys ?? "—", label: "testeurs actifs" },
                { value: betaStats?.remainingSlots ?? "—", label: "places restantes", highlight: true },
                { value: metrics?.totalSwipes != null ? metrics.totalSwipes.toLocaleString("fr-FR") : "—", label: "swipes collectés" },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <p className={`font-display text-3xl font-bold tabular-nums ${s.highlight ? "text-secondary" : "text-text-primary"}`}>{s.value}</p>
                  <p className="mt-1 text-sm text-text-secondary">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <AppMockup firstMovie={tmdbMovies[0]} allMovies={tmdbMovies} />
        </section>

        {/* ── INTÉGRATIONS ── */}
        <section className="py-16">
          <FadeIn className="mx-auto max-w-6xl px-6 text-center">
            <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-text-secondary/60">
              Fonctionne avec ta stack self-hosted
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {INTEGRATIONS.map((p) => <IntegrationLogo key={p.name} p={p} />)}
            </div>
          </FadeIn>
        </section>

        {/* ── CONFIDENTIALITÉ ── */}
        <section className="bg-surface py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <FadeIn>
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">Privacy first</p>
                <h2 className="font-display text-4xl font-bold text-text-primary">
                  Pas de compte traceable.<br />Pas de données perso.
                </h2>
                <p className="mt-4 max-w-sm leading-relaxed text-text-secondary">
                  On est en beta — on demande juste <strong className="text-text-primary">un email</strong> pour
                  éviter les abus. Pas de newsletter, pas de tracking, pas de revente. Jamais.
                </p>
                <p className="mt-3 max-w-sm leading-relaxed text-text-secondary">
                  Après l'import, tu reçois une <strong className="font-semibold text-secondary">clé unique XXXX-YYYY</strong>.
                  C'est ton seul identifiant — non rattachable à une identité réelle.
                </p>
                <button onClick={handleCta} className="cursor-pointer mt-7 inline-block rounded-[8px] bg-primary px-7 py-3.5 text-sm font-semibold text-text-primary transition-colors hover:brightness-110 active:brightness-90">
                  {ctaLabel("Accéder à mes recommandations →", "Demander l'accès →")}
                </button>
              </FadeIn>

              <div className="space-y-3">
                {[
                  { icon: <IcoKey />, title: "Clé XXXX-YYYY — ton seul identifiant", desc: "Note-la. Elle ne peut pas être retrouvée via ton email ni liée à une identité réelle.", color: "text-secondary border-secondary/20", delay: 100 },
                  { icon: <IcoShield />, title: "Connexion via Jellyfin / Plex", desc: "Tu te connectes avec tes identifiants existants. Aucun nouveau mot de passe.", color: "text-success border-success/20", delay: 200 },
                  { icon: <IcoFilm />, title: "Tes fichiers restent sur ton serveur", desc: "Recommandarr ne stocke que les métadonnées TMDB et tes swipes.", color: "text-secondary border-secondary/20", delay: 300 },
                  { icon: <IcoServer />, title: "100% self-hosted · Gratuit", desc: "Pas de SaaS, pas de freemium. Un outil open-source comme Jellyfin.", color: "text-warning border-warning/20", delay: 400 },
                ].map((item) => (
                  <FadeIn key={item.title} delay={item.delay as 100 | 200 | 300 | 400}>
                    <div className="flex gap-4 rounded-[12px] border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-[8px] border bg-white/[0.03] ${item.color}`}>{item.icon}</div>
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
                Contrairement à Trakt ou Letterboxd, Recommandarr sait ce qui est déjà sur <em>ton</em> serveur.
              </p>
            </FadeIn>
            <div className="grid gap-5 md:grid-cols-2">
              <FadeIn delay={100}>
                <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.02] p-7 backdrop-blur-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-error/30 bg-error/10 text-error"><IcoX /></div>
                    <p className="font-semibold text-text-secondary">Avant Recommandarr</p>
                  </div>
                  <ul className="space-y-3">
                    {["Tu scrolles ta bibliothèque pendant 30 minutes","Tu sais pas quoi choisir, tu remets Netflix","Tu re-regardes des films déjà vus","Letterboxd recommande des films pas dispo chez toi","Ton historique Jellyfin sert à rien"].map((t) => (
                      <li key={t} className="flex items-start gap-3 text-sm text-text-secondary">
                        <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-error/60" aria-hidden />{t}
                      </li>
                    ))}
                  </ul>
                </div>
              </FadeIn>
              <FadeIn delay={200}>
                <div className="rounded-[16px] border border-secondary/25 bg-secondary/[0.04] p-7 backdrop-blur-sm">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-success/30 bg-success/10 text-success"><IcoCheck /></div>
                    <p className="font-semibold text-text-primary">Avec Recommandarr</p>
                  </div>
                  <ul className="space-y-3">
                    {["Un film à la fois — décision en 5 secondes","Le moteur apprend de chaque swipe ce que tu aimes","Recommandations depuis ta bibliothèque, pas un catalogue externe","Film pas dispo ? Demande-le via Overseerr en un clic","Ton historique Jellyfin devient le carburant du moteur"].map((t) => (
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
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-5 md:grid-cols-3">
              {[
                { icon: <IcoServer />, title: "Ton serveur, tes règles", desc: "Recommandarr lit ta bibliothèque Jellyfin ou Plex. Pas de cloud, pas de données tierces. Tout reste chez toi.", color: "text-secondary border-secondary/20", delay: 100 },
                { icon: <IcoSwipe />, title: "Un film à la fois", desc: "Droite = intéressé, gauche = pas pour moi. Plus tu swipes, plus le moteur te connaît. Décision en secondes.", color: "text-accent border-accent/20", delay: 200 },
                { icon: <IcoSparkle />, title: "Le moteur apprend de toi", desc: "Tu notes chaque suggestion de 1 à 10. On mesure si le moteur pense comme toi. Il s'affine à chaque session.", color: "text-secondary border-secondary/20", delay: 300 },
              ].map((c) => (
                <FadeIn key={c.title} delay={c.delay as 100 | 200 | 300}>
                  <div className="h-full rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-7 backdrop-blur-sm transition-colors hover:bg-white/[0.05]">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-[10px] border bg-white/[0.04] ${c.color}`}>{c.icon}</div>
                    <h3 className="mt-5 font-display text-xl font-semibold text-text-primary">{c.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-text-secondary">{c.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── SWIPE MOCKUP + ÉTAPES ── */}
        <section id="how" className="py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid items-center gap-20 lg:grid-cols-2">
              <FadeIn className="order-2 flex justify-center lg:order-1" delay={100}>
                <SwipeDeck movies={tmdbMovies} />
              </FadeIn>
              <FadeIn className="order-1 lg:order-2">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">Comment ça marche</p>
                <h2 className="font-display text-4xl font-bold text-text-primary">Chaque swipe<br />entraîne le moteur</h2>
                <p className="mt-4 leading-relaxed text-text-secondary">
                  Le moteur calcule un score de pertinence selon ton profil. Tu le notes de 1 à 10.
                  Il apprend de l'écart entre sa prédiction et ta note.
                </p>
                <div className="mt-8 space-y-4">
                  {[
                    { step: "01", title: "Connecte ta bibliothèque", desc: "Entre l'URL + clé API de ton Jellyfin. L'import prend moins d'une minute.", cls: "text-secondary border-secondary/30 bg-secondary/[0.08]" },
                    { step: "02", title: "Swipe tes films", desc: "Droite = intéressé · Gauche = pas pour moi. Un film à la fois.", cls: "text-success border-success/30 bg-success/[0.08]" },
                    { step: "03", title: "Note la suggestion (1→10)", desc: "Note obligatoire à chaque swipe. C'est ce qui calibre le moteur.", cls: "text-warning border-warning/30 bg-warning/[0.08]" },
                    { step: "04", title: "Reçois tes recommandations", desc: "Sections Netflix-style générées depuis ta propre bibliothèque.", cls: "text-secondary border-secondary/30 bg-secondary/[0.08]" },
                  ].map((item) => (
                    <div key={item.step} className="flex gap-4">
                      <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[8px] border text-xs font-bold ${item.cls}`}>{item.step}</span>
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
        <section className="bg-surface py-20">
          <div className="mx-auto max-w-6xl px-6">
            <FadeIn>
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-secondary">Recommandations</p>
              <h2 className="font-display text-4xl font-bold text-text-primary">Ton Netflix perso,<br />depuis tes propres films.</h2>
              <p className="mt-3 max-w-lg text-text-secondary">L'accueil génère plusieurs rangées de suggestions, chacune avec une logique différente.</p>
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
                  <div className="h-full rounded-[12px] border border-white/[0.07] bg-white/[0.02] p-4 backdrop-blur-sm transition-colors hover:border-secondary/25 hover:bg-white/[0.04]">
                    <p className="text-sm font-semibold text-text-primary">{s.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-secondary">{s.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </section>

        {/* ── MOTEUR ── */}
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
            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Alignement", sub: "Pearson", desc: "Tes goûts vs les prédictions. Proche de 1 = le moteur pense comme toi.", value: metrics?.pearsonCorrelation != null ? metrics.pearsonCorrelation.toFixed(3) : "—", color: "text-secondary", delay: 100 },
                { label: "Écart moyen", sub: "MAE", desc: "Différence entre ce que le moteur prédit et ce que tu notes.", value: metrics?.mae != null ? metrics.mae.toFixed(2) : "—", color: "text-error", delay: 200 },
                { label: "Optimisme", sub: "Biais", desc: "+ = trop confiant · − = trop prudent.", value: metrics?.bias != null ? (metrics.bias >= 0 ? "+" : "") + metrics.bias.toFixed(2) : "—", color: "text-text-primary", delay: 300 },
                { label: "Calibration", sub: "Progression", desc: "Volume de données vers des recommandations fiables.", value: metrics?.coldStartProgress != null ? `${Math.round(metrics.coldStartProgress * 100)}%` : "—", color: "text-success", delay: 400 },
              ].map((m) => (
                <FadeIn key={m.sub} delay={m.delay as 100 | 200 | 300 | 400}>
                  <div className="rounded-[16px] border border-white/[0.07] bg-white/[0.025] p-6 backdrop-blur-sm">
                    <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary">{m.label}</p>
                    <p className="mt-0.5 text-[10px] text-text-secondary/50">{m.sub}</p>
                    <p className={`font-display mt-3 text-3xl font-bold tabular-nums ${m.color}`}>{m.value}</p>
                    <p className="mt-3 text-xs leading-relaxed text-text-secondary">{m.desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
            {metrics?.totalSwipes != null && (
              <FadeIn className="mt-5">
                <div className="rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-6 py-4 backdrop-blur-sm">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-text-secondary">Progression collective vers la fiabilité</span>
                    <span className="font-medium tabular-nums text-text-primary">
                      {metrics.totalSwipes.toLocaleString("fr-FR")} / {metrics.swipesForReliableMetrics.toLocaleString("fr-FR")} swipes
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/[0.06]" role="progressbar" aria-valuenow={Math.min(100, (metrics.totalSwipes / (metrics.swipesForReliableMetrics || 1)) * 100)} aria-valuemin={0} aria-valuemax={100}>
                    <div className="h-full rounded-full bg-secondary transition-all duration-700" style={{ width: `${Math.min(100, (metrics.totalSwipes / (metrics.swipesForReliableMetrics || 1)) * 100)}%` }} />
                  </div>
                </div>
              </FadeIn>
            )}
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="bg-surface py-28 text-center">
          <FadeIn className="mx-auto max-w-lg px-6">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-secondary" aria-hidden />
              <span className="text-xs font-semibold uppercase tracking-widest text-secondary">
                {betaStats ? `${betaStats.remainingSlots} places restantes` : "Accès limité"}
              </span>
            </div>
            <h2 className="font-display text-4xl font-bold text-text-primary">Ce soir,<br />tu sais quoi regarder.</h2>
            <p className="mt-4 text-text-secondary">
              Connecte ta bibliothèque Jellyfin ou Plex, reçois ta clé unique — et commence à swiper dans la minute.
            </p>
            <button onClick={handleCta} className="cursor-pointer mt-8 inline-block rounded-[8px] bg-primary px-10 py-4 text-base font-semibold text-text-primary transition-colors hover:brightness-110 active:brightness-90">
              {ctaLabel("Voir mes recommandations →", "Rejoindre la beta →")}
            </button>
            <p className="mt-5 text-xs text-text-secondary/70">
              {isLoggedIn
                ? "Tu es connecté · Swipe, découvre, profite."
                : "Un email pour éviter les abus · Clé unique XXXX-YYYY · Aucun mot de passe Recommandarr"}
            </p>
          </FadeIn>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6">
          <span className="select-none font-display text-lg font-bold text-text-primary">
            Recomm<span className="text-secondary">andarr</span>
            <span className="ml-2 text-xs font-normal text-text-secondary">beta v0.1</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {["ASP.NET Core", "PostgreSQL", "Jellyfin", "Plex", "TMDB", "Overseerr"].map((t) => (
              <span key={t} className="rounded-full border border-white/[0.07] px-3 py-1 text-xs text-text-secondary">{t}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

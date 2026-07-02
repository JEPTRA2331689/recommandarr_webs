"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { Movie, EngineMetrics, SwipePayload } from "@/types";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { DeckCard } from "@/components/DeckCard";
import { RatingModal } from "@/components/RatingModal";
import { MetricsPanel } from "@/components/MetricsPanel";

// ── Constantes ────────────────────────────────────────────────────────────────

const SECTIONS = [
  { value: "for_you",            label: "Pour toi" },
  { value: "daily_discovery",    label: "Découverte" },
  { value: "favorite_actors",    label: "Acteurs favoris" },
  { value: "favorite_directors", label: "Réalisateurs" },
  { value: "hidden_gems",        label: "Pépites cachées" },
  { value: "weekly_discovery",   label: "Cette semaine" },
  { value: "recent_releases",    label: "Récents" },
  { value: "surprise_me",        label: "Surprise !" },
  { value: "because_you_liked",  label: "Parce que tu aimes..." },
] as const;

type SectionKey = (typeof SECTIONS)[number]["value"];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SwipePage() {
  const router = useRouter();
  const { ready } = useAuthGuard();
  const [movies, setMovies]           = useState<Movie[]>([]);
  const [index, setIndex]             = useState(0);
  const [loading, setLoading]         = useState(true);
  const [metrics, setMetrics]         = useState<EngineMetrics | null>(null);
  const [swipeCount, setSwipeCount]   = useState(0);
  const [section, setSection]         = useState<SectionKey>("for_you");
  const [exitDir, setExitDir]         = useState<"left" | "right" | null>(null);
  const [pendingSwipe, setPendingSwipe] = useState<{ movie: Movie; direction: "like" | "skip" } | null>(null);
  const [lastFeedback, setLastFeedback] = useState<"like" | "skip" | null>(null);

  const seenTmdbIds   = useRef<Set<number>>(new Set());
  const lastLikedId   = useRef<number | null>(null);
  const swipeStart    = useRef(Date.now());

  const currentMovie = movies[index] ?? null;

  // ── Chargement ──
  const loadMovies = useCallback(async () => {
    setLoading(true);
    try {
      const exclude    = seenTmdbIds.current.size > 0
        ? `&excludeIds=${[...seenTmdbIds.current].join(",")}`
        : "";
      const basedOn    = section === "because_you_liked" && lastLikedId.current
        ? `&basedOnMovieId=${lastLikedId.current}`
        : "";
      const data = await api.get<Movie[]>(
        `/api/recommendations?section=${section}&count=20${exclude}${basedOn}`
      );
      setIndex(0);
      setMovies(data ?? []);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 401) { router.replace("/onboarding"); return; }
    } finally {
      setLoading(false);
    }
  }, [router, section]);

  const loadMetrics = useCallback(async () => {
    try {
      const m = await api.get<EngineMetrics>("/api/metrics/engine");
      setMetrics(m);
    } catch { /* silencieux */ }
  }, []);

  // Reload on ready
  useEffect(() => {
    if (!ready) return;
    loadMovies();
    loadMetrics();
  }, [ready, loadMovies, loadMetrics]);

  // Section change → vider les exclusions + recharger
  const handleSectionChange = (s: SectionKey) => {
    if (s === section) return;
    if (s === "because_you_liked" && !lastLikedId.current) return;
    seenTmdbIds.current.clear();
    setSection(s);
  };

  // ── Swipe ──
  function initiateSwipe(movie: Movie, direction: "like" | "skip") {
    if (exitDir) return; // prevent double-tap
    const dir = direction === "like" ? "right" : "left";
    setExitDir(dir);
    setTimeout(() => {
      setExitDir(null);
      setPendingSwipe({ movie, direction });
    }, 270);
  }

  async function confirmSwipe(rating: number, reason?: number) {
    if (!pendingSwipe) return;
    const { movie, direction } = pendingSwipe;
    const durationMs = Date.now() - swipeStart.current;
    swipeStart.current = Date.now();

    setPendingSwipe(null);
    setLastFeedback(direction);
    setTimeout(() => setLastFeedback(null), 700);

    if (direction === "like") lastLikedId.current = movie.tmdbId;
    seenTmdbIds.current.add(movie.tmdbId);

    const next = index + 1;
    if (next >= movies.length - 3) loadMovies();
    else setIndex(next);

    const newCount = swipeCount + 1;
    setSwipeCount(newCount);

    const payload: SwipePayload = {
      movieId: movie.id,
      direction: direction === "like" ? 1 : 0,
      durationMs,
      context: 1,
      relevanceRating: rating,
      ...(direction === "skip" && reason != null ? { swipeReason: reason as SwipePayload["swipeReason"] } : {}),
    };

    try { await api.post("/api/swipe", payload); } catch { /* silencieux */ }

    if (newCount % 3 === 0) {
      try { await api.post("/api/recommendations/profile/update"); } catch { /* silencieux */ }
    }
    if (newCount % 5 === 0) loadMetrics();
  }

  // ── Clavier ──
  useEffect(() => {
    if (pendingSwipe) return;
    function onKey(e: KeyboardEvent) {
      if (!currentMovie) return;
      if (e.key === "ArrowRight" || e.key === "l") initiateSwipe(currentMovie, "like");
      if (e.key === "ArrowLeft"  || e.key === "j") initiateSwipe(currentMovie, "skip");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentMovie, pendingSwipe, exitDir]);

  if (!ready) return null;

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-bg-primary">

      {/* Glow rouge radial */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: "radial-gradient(ellipse 70vw 50vh at 50% 62%, rgba(160,53,48,0.24), transparent 68%)",
        }}
      />

      {/* ── NAVBAR ── */}
      <Navbar
        activePage="swipe"
        variant="solid"
        rightSlot={
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-text-secondary">
              {swipeCount} swipe{swipeCount !== 1 ? "s" : ""}
            </span>
            <Link href="/account" className="rounded-button border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors">
              Compte
            </Link>
          </div>
        }
      />

      {/* ── SECTION TABS ── */}
      <div
        className="relative z-30 flex-shrink-0 overflow-x-auto border-b border-border/50"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-2 px-6 py-2.5 min-w-max">
          {SECTIONS.map((s) => {
            const isDisabled = s.value === "because_you_liked" && !lastLikedId.current;
            return (
              <button
                key={s.value}
                onClick={() => !isDisabled && handleSectionChange(s.value)}
                disabled={isDisabled}
                className={cn(
                  "flex-shrink-0 rounded-pill border px-3.5 py-1.5 text-[11px] font-semibold transition-all duration-150",
                  section === s.value
                    ? "cursor-default border-secondary bg-secondary text-bg-primary"
                    : isDisabled
                    ? "border-border/40 text-text-secondary/30 cursor-not-allowed"
                    : "cursor-pointer border-border text-text-secondary hover:border-secondary/40 hover:text-text-primary"
                )}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── CORPS ── */}
      <div className="relative z-10 flex flex-1 overflow-hidden gap-4 px-4 pb-4 max-w-7xl mx-auto w-full min-h-0">

        {/* Sidebar métriques */}
        <MetricsPanel metrics={metrics} swipeCount={swipeCount} />

        {/* Zone swipe */}
        <div className="flex flex-1 flex-col items-center justify-between min-h-0 py-3">

          {loading ? (
            /* Skeleton */
            <div className="flex flex-1 flex-col items-center justify-center gap-6">
              <div className="h-[50vh] aspect-[2/3] rounded-[20px] bg-surface animate-pulse" />
              <div className="h-3 w-48 rounded-pill bg-surface animate-pulse" />
            </div>
          ) : !currentMovie ? (
            /* Empty */
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface border border-border">
                <svg className="h-9 w-9 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18 18 6M6 6l12 12" />
                </svg>
              </div>
              <p className="text-sm text-text-secondary">Plus de films à afficher.</p>
              <button
                onClick={loadMovies}
                className="cursor-pointer rounded-button border border-border px-5 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Recharger
              </button>
            </div>
          ) : (
            <>
              {/* Flash feedback (like / skip) */}
              {lastFeedback && (
                <div className={cn(
                  "pointer-events-none absolute inset-0 z-20 flex items-center justify-center",
                  lastFeedback === "like" ? "bg-swipe-like/8" : "bg-swipe-skip/8"
                )}>
                  <div className={cn(
                    "flex h-20 w-20 items-center justify-center rounded-full",
                    lastFeedback === "like" ? "bg-swipe-like/20" : "bg-swipe-skip/20"
                  )}>
                    {lastFeedback === "like" ? (
                      <svg className="h-9 w-9 text-swipe-like" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    ) : (
                      <svg className="h-9 w-9 text-swipe-skip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                </div>
              )}

              {/* ── CARD DECK ── */}
              <div className="relative flex flex-1 items-center justify-center w-full overflow-hidden" style={{ minHeight: 330 }}>
                <DeckCard movie={movies[index - 2]} order={-2} exitDir={null} />
                <DeckCard movie={movies[index - 1]} order={-1} exitDir={null} />
                <DeckCard
                  movie={currentMovie}
                  order={0}
                  exitDir={exitDir}
                  onClick={() => router.push(`/movies/${currentMovie.id}?from=swipe`)}
                />
                <DeckCard movie={movies[index + 1]} order={1} exitDir={null} />
                <DeckCard movie={movies[index + 2]} order={2} exitDir={null} />
              </div>

              {/* Overview */}
              {currentMovie.overview && (
                <p className="flex-shrink-0 mt-1 max-w-[280px] text-center text-xs leading-relaxed text-text-secondary line-clamp-2 px-4">
                  {currentMovie.overview}
                </p>
              )}

              {/* ── BOUTONS SWIPE ── */}
              <div className="flex-shrink-0 flex items-center justify-center gap-10 py-3 pb-20 md:pb-3">
                {/* Skip */}
                <button
                  onClick={() => currentMovie && !exitDir && initiateSwipe(currentMovie, "skip")}
                  className="group flex flex-col items-center gap-1.5 cursor-pointer"
                  aria-label="Passer"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-swipe-skip/40 bg-swipe-skip/10 transition-all group-hover:border-swipe-skip group-hover:bg-swipe-skip/20 group-hover:scale-110 group-active:scale-95">
                    <svg className="h-6 w-6 text-swipe-skip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-text-secondary group-hover:text-swipe-skip transition-colors">J / ←</span>
                </button>

                {/* Info */}
                <button
                  onClick={() => currentMovie && router.push(`/movies/${currentMovie.id}?from=swipe`)}
                  className="group flex h-10 w-10 items-center justify-center cursor-pointer rounded-full border border-border bg-surface/60 backdrop-blur-sm transition-all hover:bg-surface hover:border-secondary/40"
                  aria-label="Détails"
                >
                  <svg className="h-4 w-4 text-text-secondary group-hover:text-text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                </button>

                {/* Like */}
                <button
                  onClick={() => currentMovie && !exitDir && initiateSwipe(currentMovie, "like")}
                  className="group flex flex-col items-center gap-1.5 cursor-pointer"
                  aria-label="J'aime"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-swipe-like/40 bg-swipe-like/10 transition-all group-hover:border-swipe-like group-hover:bg-swipe-like/20 group-hover:scale-110 group-active:scale-95">
                    <svg className="h-6 w-6 text-swipe-like" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-text-secondary group-hover:text-swipe-like transition-colors">L / →</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal notation */}
      {pendingSwipe && (
        <RatingModal
          movie={pendingSwipe.movie}
          direction={pendingSwipe.direction}
          onSubmit={confirmSwipe}
        />
      )}
    </div>
  );
}

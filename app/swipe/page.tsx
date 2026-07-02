"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { Movie, EngineMetrics, SwipePayload } from "@/types";
import { cn } from "@/lib/utils";

// ── Constantes ────────────────────────────────────────────────────────────────

const SKIP_REASONS = [
  { value: 1, label: "Déjà vu" },
  { value: 2, label: "Pas mon genre" },
  { value: 3, label: "Pas d'humeur" },
  { value: 4, label: "Mauvaise note" },
  { value: 0, label: "Autre" },
] as const;

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

function posterUrl(path: string | null, size = "w500"): string {
  if (!path) return "";
  if (path.startsWith("/")) return `https://image.tmdb.org/t/p/${size}${path}`;
  if (path.startsWith("https://image.tmdb.org/")) return path;
  return "";
}

// ── Modal de notation ─────────────────────────────────────────────────────────

function RatingModal({
  movie,
  direction,
  onSubmit,
}: {
  movie: Movie;
  direction: "like" | "skip";
  onSubmit: (rating: number, reason?: number) => void;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [reason, setReason] = useState<number | null>(null);
  const canSubmit = rating !== null && (direction === "like" || reason !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center">
      <div className="w-full max-w-sm rounded-sheet border border-border bg-surface p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className={cn(
            "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border",
            direction === "like"
              ? "border-swipe-like/40 bg-swipe-like/10 text-swipe-like"
              : "border-swipe-skip/40 bg-swipe-skip/10 text-swipe-skip"
          )}>
            {direction === "like" ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-text-primary line-clamp-1">{movie.title}</p>
            <p className="text-xs text-text-secondary">
              {direction === "like" ? "Tu sembles intéressé" : "Pas intéressé"}
            </p>
          </div>
        </div>

        <div className="mb-5">
          <p className="mb-3 text-sm font-medium text-text-primary">
            Note la pertinence de cette recommandation <span className="text-accent">*</span>
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setRating(n)}
                className={cn(
                  "h-9 w-9 cursor-pointer rounded-button border text-sm font-semibold transition-all",
                  rating === n
                    ? "border-secondary bg-secondary text-bg-primary"
                    : "border-border text-text-secondary hover:border-secondary/50 hover:text-text-primary"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-secondary">1 = hors sujet · 10 = exactement ce que je veux</p>
        </div>

        {direction === "skip" && (
          <div className="mb-5">
            <p className="mb-3 text-sm font-medium text-text-primary">
              Pourquoi ? <span className="text-accent">*</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {SKIP_REASONS.map((r) => (
                <button
                  key={r.value}
                  onClick={() => setReason(r.value)}
                  className={cn(
                    "cursor-pointer rounded-pill border px-3 py-1.5 text-xs font-medium transition-all",
                    reason === r.value
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-border text-text-secondary hover:border-accent/40 hover:text-text-primary"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => canSubmit && onSubmit(rating!, reason ?? undefined)}
          disabled={!canSubmit}
          className="w-full cursor-pointer rounded-button bg-primary py-3 text-sm font-semibold text-text-primary transition-all hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
        >
          Valider
        </button>
      </div>
    </div>
  );
}

// ── Sidebar métriques ─────────────────────────────────────────────────────────

function MetricsPanel({ metrics, swipeCount }: { metrics: EngineMetrics | null; swipeCount: number }) {
  if (!metrics) return null;
  const progress = Math.min(100, (swipeCount / (metrics.swipesForReliableMetrics || 20)) * 100);

  return (
    <div className="hidden lg:flex flex-col gap-3 w-56 flex-shrink-0 pt-2">
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3">Engine</p>
        <div className="space-y-3">
          {[
            { label: "Pearson", value: metrics.pearsonCorrelation?.toFixed(3), color: "text-secondary" },
            { label: "MAE",     value: metrics.mae?.toFixed(2),                color: "text-accent"    },
            { label: "Biais",   value: metrics.bias != null ? (metrics.bias >= 0 ? "+" : "") + metrics.bias.toFixed(2) : null, color: "text-text-primary" },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex justify-between text-xs">
              <span className="text-text-secondary">{label}</span>
              <span className={cn("font-semibold", color)}>{value ?? "—"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-text-secondary">Cold start</span>
          <span className="text-text-primary font-medium">{swipeCount} swipes</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-alt">
          <div className="h-full rounded-full bg-secondary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {metrics.swipesForReliableMetrics - swipeCount > 0
            ? `Encore ${metrics.swipesForReliableMetrics - swipeCount} swipes`
            : "Métriques fiables ✓"}
        </p>
      </div>
    </div>
  );
}

// ── Carte du deck ─────────────────────────────────────────────────────────────

function DeckCard({
  movie,
  order,
  exitDir,
  onClick,
}: {
  movie: Movie | undefined;
  order: number; // -2 -1 0 +1 +2
  exitDir: "left" | "right" | null;
  onClick?: () => void;
}) {
  if (!movie) return null;

  const isCenter = order === 0;
  const absOrder = Math.abs(order);

  // Deck positioning
  const translateX = order * 172;
  const scale      = isCenter ? 1 : absOrder === 1 ? 0.855 : 0.70;
  const opacity    = isCenter ? 1 : absOrder === 1 ? 0.55 : 0.25;
  const zIndex     = 30 - absOrder * 10;

  // Swipe exit — ease-in for exiting (feels natural)
  const exitTransform = exitDir === "right"
    ? "translateX(440px) rotate(18deg) scale(0.88)"
    : exitDir === "left"
    ? "translateX(-440px) rotate(-18deg) scale(0.88)"
    : null;

  return (
    <div
      className="absolute"
      style={{
        transform:  exitTransform ?? `translateX(${translateX}px) scale(${scale})`,
        opacity:    exitDir ? 0 : opacity,
        zIndex,
        transition: exitDir
          ? "transform 270ms cubic-bezier(0.4,0,1,1), opacity 200ms ease-in"
          : "transform 300ms cubic-bezier(0.22,1,0.36,1), opacity 300ms ease-out",
        willChange: "transform, opacity",
      }}
    >
      <div
        role={isCenter ? "button" : undefined}
        tabIndex={isCenter ? 0 : -1}
        onClick={isCenter ? onClick : undefined}
        onKeyDown={isCenter ? (e) => e.key === "Enter" && onClick?.() : undefined}
        className={cn(
          "relative overflow-hidden rounded-[20px] bg-surface select-none",
          "w-[210px] h-[315px] md:w-[240px] md:h-[360px]",
          isCenter && "cursor-pointer shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
        )}
      >
        {/* Poster */}
        {movie.posterPath ? (
          <Image
            src={posterUrl(movie.posterPath)}
            alt={movie.title}
            fill
            className="object-cover"
            priority={isCenter}
            sizes="260px"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface-alt px-4 text-center">
            <svg className="h-12 w-12 text-text-secondary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
            <span className="text-xs text-text-secondary line-clamp-3">{movie.title}</span>
          </div>
        )}

        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/94 via-black/20 to-transparent" />

        {/* Badge disponible (top-left) */}
        {movie.isAvailable && (
          <div className="absolute top-3 left-3 flex h-7 w-7 items-center justify-center rounded-full bg-success shadow-lg">
            <svg className="h-3.5 w-3.5 text-bg-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        )}

        {/* Rating TMDB (top-right) */}
        {movie.tmdbRating > 0 && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-button bg-black/65 backdrop-blur-sm px-2 py-1">
            <span className="text-sm font-bold text-white leading-none">{movie.tmdbRating.toFixed(1)}</span>
            <span className="text-warning text-xs leading-none">★</span>
          </div>
        )}

        {/* Score Recommandarr */}
        {movie.score != null && (
          <div className="absolute top-11 right-3 rounded-button bg-secondary/90 px-1.5 py-0.5 text-[10px] font-bold text-bg-primary">
            {(movie.score * 100).toFixed(0)}%
          </div>
        )}

        {/* Infos bas */}
        <div className="absolute bottom-0 left-0 right-0 p-3.5">
          <p className="font-display text-[16px] md:text-[17px] font-bold leading-tight text-white line-clamp-2">
            {movie.title}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-white/60">
            {movie.releaseDate && <span>{movie.releaseDate.slice(0, 4)}</span>}
            {movie.runtimeMinutes && (
              <>
                <span className="text-white/30">·</span>
                <span>{movie.runtimeMinutes}min</span>
              </>
            )}
          </div>
          {(movie.genres?.length ?? 0) > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {movie.genres!.slice(0, 2).map((g) => (
                <span
                  key={g}
                  className="rounded-pill bg-white/10 border border-white/10 px-2 py-0.5 text-[10px] text-white/70 backdrop-blur-sm"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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

    if (newCount % 10 === 0) {
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
      <header className="relative z-40 flex-shrink-0 border-b border-border backdrop-blur-md" style={{ background: "var(--color-nav-bg)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="font-display text-xl font-bold text-text-primary select-none">
            Recomm<span className="text-secondary">andarr</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/recommendations" className="rounded-button px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Recommandations
            </Link>
            <Link href="/swipe" className="rounded-button bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
              Swipe
            </Link>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline text-text-secondary">{swipeCount} swipe{swipeCount !== 1 ? "s" : ""}</span>
            <Link href="/account" className="rounded-button border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors">
              Compte
            </Link>
          </div>
        </div>
      </header>

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
              <div className="w-[240px] h-[360px] rounded-[20px] bg-surface animate-pulse" />
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
              <div className="flex-shrink-0 flex items-center justify-center gap-10 py-3">
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

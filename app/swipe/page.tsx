"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { Movie, EngineMetrics, SwipePayload } from "@/types";
import { cn } from "@/lib/utils";

const SKIP_REASONS = [
  { value: 1, label: "Déjà vu" },
  { value: 2, label: "Pas mon genre" },
  { value: 3, label: "Pas d'humeur" },
  { value: 4, label: "Mauvaise note" },
  { value: 0, label: "Autre" },
] as const;

function posterUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("/")) return `https://image.tmdb.org/t/p/w500${path}`;
  if (path.startsWith("https://image.tmdb.org/")) return path;
  return "";
}

// Modal de notation post-swipe
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

        {/* Note de pertinence */}
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
                  "h-9 w-9 rounded-button border text-sm font-semibold transition-all",
                  rating === n
                    ? "border-secondary bg-secondary text-bg-primary"
                    : "border-border text-text-secondary hover:border-secondary/50 hover:text-text-primary"
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-text-secondary">
            1 = hors sujet · 10 = exactement ce que je veux
          </p>
        </div>

        {/* Raison (seulement pour skip) */}
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
                    "rounded-pill border px-3 py-1.5 text-xs font-medium transition-all",
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
          className="w-full rounded-button bg-primary py-3 text-sm font-semibold text-text-primary transition-all hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
        >
          Valider
        </button>
      </div>
    </div>
  );
}

// Sidebar métriques
function MetricsPanel({ metrics, swipeCount }: { metrics: EngineMetrics | null; swipeCount: number }) {
  if (!metrics) return null;
  const progress = Math.min(100, (swipeCount / (metrics.swipesForReliableMetrics || 20)) * 100);

  return (
    <div className="hidden lg:flex flex-col gap-3 w-64 flex-shrink-0">
      <div className="rounded-card border border-border bg-surface p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-secondary mb-3">Engine</p>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-secondary">Pearson</span>
              <span className="font-semibold text-secondary">
                {metrics.pearsonCorrelation != null ? metrics.pearsonCorrelation.toFixed(3) : "—"}
              </span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-secondary">MAE</span>
              <span className="font-semibold text-accent">
                {metrics.mae != null ? metrics.mae.toFixed(2) : "—"}
              </span>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-text-secondary">Biais</span>
              <span className="font-semibold text-text-primary">
                {metrics.bias != null ? (metrics.bias >= 0 ? "+" : "") + metrics.bias.toFixed(2) : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface p-4">
        <div className="flex justify-between text-xs mb-2">
          <span className="text-text-secondary">Cold start</span>
          <span className="text-text-primary font-medium">{swipeCount} swipes</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface-alt">
          <div
            className="h-full rounded-full bg-secondary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-text-secondary">
          {metrics.swipesForReliableMetrics - swipeCount > 0
            ? `Encore ${metrics.swipesForReliableMetrics - swipeCount} swipes pour des métriques fiables`
            : "Métriques fiables ✓"}
        </p>
      </div>
    </div>
  );
}

export default function SwipePage() {
  const router = useRouter();
  const { ready } = useAuthGuard();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<EngineMetrics | null>(null);
  const [swipeCount, setSwipeCount] = useState(0);
  const [pendingSwipe, setPendingSwipe] = useState<{ movie: Movie; direction: "like" | "skip" } | null>(null);
  const [lastFeedback, setLastFeedback] = useState<"like" | "skip" | null>(null);
  const seenIds = useRef<Set<string>>(new Set());
  const swipeStart = useRef(Date.now());

  const currentMovie = movies[index] ?? null;

  const loadMovies = useCallback(async () => {
    setLoading(true);
    try {
      const exclude = seenIds.current.size > 0
        ? `&excludeIds=${[...seenIds.current].map(encodeURIComponent).join(",")}`
        : "";
      const data = await api.get<Movie[]>(`/api/beta/recommendations?section=for_you&count=20${exclude}`);
      // Reset index before setting new movies to prevent stale index pointing to undefined
      setIndex(0);
      setMovies(data ?? []);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 401) { router.replace("/onboarding"); return; }
    } finally {
      setLoading(false);
    }
  }, [router]);

  const loadMetrics = useCallback(async () => {
    try {
      const m = await api.get<EngineMetrics>("/api/metrics/engine");
      setMetrics(m);
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => {
    if (!ready) return;
    loadMovies();
    loadMetrics();
  }, [ready, loadMovies, loadMetrics]);

  // Initier le swipe → ouvrir la modal de notation
  function initiateSwipe(movie: Movie, direction: "like" | "skip") {
    setPendingSwipe({ movie, direction });
  }

  // Confirmer le swipe après notation
  async function confirmSwipe(rating: number, reason?: number) {
    if (!pendingSwipe) return;
    const { movie, direction } = pendingSwipe;
    const durationMs = Date.now() - swipeStart.current;
    swipeStart.current = Date.now();

    setPendingSwipe(null);
    setLastFeedback(direction);
    setTimeout(() => setLastFeedback(null), 700);

    seenIds.current.add(movie.id);
    const next = index + 1;
    if (next >= movies.length - 3) loadMovies();
    else setIndex(next);

    const newCount = swipeCount + 1;
    setSwipeCount(newCount);

    const payload: SwipePayload = {
      movieId: movie.id,
      direction: direction === "like" ? 1 : 0,
      durationMs,
      context: 1, // swipe_page
      relevanceRating: rating,
      ...(direction === "skip" && reason != null ? { swipeReason: reason as SwipePayload["swipeReason"] } : {}),
    };

    try {
      await api.post("/api/swipe", payload);
    } catch { /* silencieux */ }

    // Mise à jour profil tous les 10 swipes
    if (newCount % 10 === 0) {
      try {
        await api.post("/api/recommendations/profile/update");
      } catch { /* silencieux */ }
    }

    // Rafraîchir métriques tous les 5 swipes
    if (newCount % 5 === 0) loadMetrics();
  }

  // Raccourcis clavier
  useEffect(() => {
    if (pendingSwipe) return;
    function onKey(e: KeyboardEvent) {
      if (!currentMovie) return;
      if (e.key === "ArrowRight" || e.key === "l") initiateSwipe(currentMovie, "like");
      if (e.key === "ArrowLeft" || e.key === "j") initiateSwipe(currentMovie, "skip");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [currentMovie, pendingSwipe]);

  if (!ready) return null;

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Nav */}
      <header className="flex-shrink-0 border-b border-border backdrop-blur-md" style={{ background: "var(--color-nav-bg)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link href="/" className="font-display text-xl font-bold text-text-primary">
            Swipe<span className="text-accent">Film</span>
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
            <span className="text-text-secondary">{swipeCount} swipe{swipeCount !== 1 ? "s" : ""}</span>
            <Link href="/account" className="rounded-button border border-border px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary transition-colors">
              Compte
            </Link>
          </div>
        </div>
      </header>

      {/* Corps */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4 max-w-7xl mx-auto w-full">
        {/* Sidebar métriques */}
        <MetricsPanel metrics={metrics} swipeCount={swipeCount} />

        {/* Zone swipe principale */}
        <div className="flex flex-1 flex-col items-center justify-between min-h-0">
          {loading ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="h-10 w-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
            </div>
          ) : !currentMovie ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-text-secondary">
              <p className="text-sm">Plus de films disponibles.</p>
              <button
                onClick={loadMovies}
                className="rounded-button border border-border px-5 py-2.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
              >
                Recharger
              </button>
            </div>
          ) : (
            <>
              {/* Feedback overlay */}
              {lastFeedback && (
                <div className={cn(
                  "absolute inset-0 pointer-events-none z-10 flex items-center justify-center transition-opacity",
                  lastFeedback === "like" ? "bg-swipe-like/8" : "bg-swipe-skip/8"
                )}>
                  <div className={cn(
                    "h-20 w-20 rounded-full flex items-center justify-center text-3xl",
                    lastFeedback === "like" ? "bg-swipe-like/20 text-swipe-like" : "bg-swipe-skip/20 text-swipe-skip"
                  )}>
                    {lastFeedback === "like" ? "✓" : "✕"}
                  </div>
                </div>
              )}

              {/* Carte film */}
              <div className="relative flex-1 flex items-center justify-center w-full max-w-sm">
                {/* Cartes empilées derrière */}
                {movies[index + 1] && (
                  <div className="absolute h-full w-full max-h-[500px] max-w-xs rounded-card border border-border bg-surface-alt opacity-50 scale-95 translate-y-2 -rotate-1" />
                )}
                {/* Carte principale — clic = détail */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/movies/${currentMovie.id}?from=swipe`)}
                  onKeyDown={(e) => e.key === "Enter" && router.push(`/movies/${currentMovie.id}?from=swipe`)}
                  className="relative h-full w-full max-h-[500px] max-w-xs rounded-card border border-border bg-surface overflow-hidden cursor-pointer"
                >
                  {currentMovie.posterPath ? (
                    <Image
                      src={posterUrl(currentMovie.posterPath)}
                      alt={currentMovie.title}
                      fill
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center bg-surface-alt">
                      <svg className="h-16 w-16 text-text-secondary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
                    <p className="font-display text-xl font-bold text-white line-clamp-1">{currentMovie.title}</p>
                    <div className="mt-1 flex items-center gap-2 text-sm text-white/70">
                      {currentMovie.releaseDate && <span>{currentMovie.releaseDate.slice(0, 4)}</span>}
                      {currentMovie.tmdbRating > 0 && (
                        <>
                          <span>·</span>
                          <span className="text-warning">★ {currentMovie.tmdbRating.toFixed(1)}</span>
                        </>
                      )}
                      {currentMovie.runtimeMinutes && (
                        <>
                          <span>·</span>
                          <span>{currentMovie.runtimeMinutes}min</span>
                        </>
                      )}
                    </div>
                    {currentMovie.genres && currentMovie.genres.length > 0 && (
                      <div className="mt-2 flex gap-1 flex-wrap">
                        {currentMovie.genres.slice(0, 3).map((g) => (
                          <span key={g} className="rounded-pill bg-white/10 px-2 py-0.5 text-[10px] text-white/80 border border-white/10">
                            {g}
                          </span>
                        ))}
                      </div>
                    )}
                    {currentMovie.score != null && (
                      <div className="absolute top-3 right-3 rounded-button bg-secondary px-2 py-0.5 text-xs font-bold text-bg-primary">
                        {(currentMovie.score * 100).toFixed(0)}%
                      </div>
                    )}
                  </div>
                  {currentMovie.isAvailable && (
                    <span className="absolute top-3 left-3 rounded-pill bg-success/90 px-2 py-1 text-[10px] font-semibold text-bg-primary">
                      Disponible
                    </span>
                  )}
                </div>
              </div>

              {/* Infos synopsis */}
              {currentMovie.overview && (
                <p className="mt-2 max-w-sm text-center text-xs leading-relaxed text-text-secondary line-clamp-2 px-4">
                  {currentMovie.overview}
                </p>
              )}

              {/* Boutons swipe */}
              <div className="flex-shrink-0 flex items-center justify-center gap-8 py-5">
                <button
                  onClick={() => currentMovie && initiateSwipe(currentMovie, "skip")}
                  className="group flex flex-col items-center gap-1.5"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-swipe-skip/40 bg-swipe-skip/10 transition-all group-hover:border-swipe-skip group-hover:bg-swipe-skip/20 group-hover:scale-110 group-active:scale-95">
                    <svg className="h-6 w-6 text-swipe-skip" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </div>
                  <span className="text-[10px] text-text-secondary group-hover:text-swipe-skip transition-colors">J / ←</span>
                </button>

                <button
                  onClick={() => currentMovie && initiateSwipe(currentMovie, "like")}
                  className="group flex flex-col items-center gap-1.5"
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

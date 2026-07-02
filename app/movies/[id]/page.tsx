"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { cn, posterUrl } from "@/lib/utils";
import type { Movie, SwipePayload } from "@/types";
import { RatingModal } from "@/components/RatingModal";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatRuntime(min: number | null): string | null {
  if (!min) return null;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h${m > 0 ? ` ${m}min` : ""}` : `${m}min`;
}

// ── Detail row ────────────────────────────────────────────────────────────────

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="w-24 flex-shrink-0 text-xs uppercase tracking-wider text-text-secondary pt-0.5">{label}</span>
      <span className="flex-1 text-sm text-text-primary">{children}</span>
    </div>
  );
}

// ── Rating stars ──────────────────────────────────────────────────────────────

function RatingStars({ rating }: { rating: number }) {
  const filled = Math.round(rating / 2);
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg
          key={i}
          className={cn("h-3 w-3", i < filled ? "text-warning" : "text-border")}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" />
        </svg>
      ))}
      <span className="ml-1 text-xs text-text-secondary">{rating.toFixed(1)}/10</span>
    </span>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function MovieDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { ready } = useAuthGuard();

  const id = params.id as string;
  const fromParam = searchParams.get("from");
  const swipeContext: SwipePayload["context"] =
    fromParam === "swipe" ? 1 : fromParam === "recommendations" ? 2 : 0;

  const [movie, setMovie] = useState<Movie | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [credits, setCredits] = useState<{ name: string; character: string; photo: string | null }[]>([]);

  // Swipe flow
  const [pendingDir, setPendingDir] = useState<"like" | "skip" | null>(null);
  const [swipeDone, setSwipeDone] = useState<"like" | "skip" | null>(null);
  const swipeStart = useRef(Date.now());

  useEffect(() => {
    if (!ready) return;
    swipeStart.current = Date.now();
    api.get<Movie>(`/api/movies/${id}`)
      .then((m) => {
        setMovie(m);
        const lang = navigator.language || "en-US";
        const enc  = encodeURIComponent(lang);

        // TMDB localized data + credits en parallèle
        Promise.all([
          fetch(`/api/tmdb/movie?id=${m.tmdbId}&language=${enc}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null) as Promise<{
              title: string | null;
              overview: string | null;
              posterPath: string | null;
              genres: string[];
            } | null>,
          fetch(`/api/tmdb/credits?id=${m.tmdbId}&language=${enc}`)
            .then((r) => (r.ok ? r.json() : { cast: [] }))
            .catch(() => ({ cast: [] })) as Promise<{
              cast: { name: string; character: string; photo: string | null }[];
            }>,
        ]).then(([tmdb, cred]) => {
          if (tmdb) {
            setMovie((prev) =>
              prev
                ? {
                    ...prev,
                    ...(tmdb.title      ? { title:      tmdb.title }      : {}),
                    ...(tmdb.overview   ? { overview:   tmdb.overview }   : {}),
                    ...(tmdb.posterPath ? { posterPath: tmdb.posterPath } : {}),
                    ...(tmdb.genres?.length ? { genres: tmdb.genres }     : {}),
                  }
                : null
            );
          }
          setCredits(cred.cast ?? []);
        });
      })
      .catch(() => setError("Film introuvable."))
      .finally(() => setLoading(false));
  }, [ready, id]);

  async function confirmSwipe(rating: number, reason?: number) {
    if (!movie || !pendingDir) return;
    const dir = pendingDir;
    setPendingDir(null);
    setSwipeDone(dir);

    const payload: SwipePayload = {
      movieId: movie.id,
      direction: dir === "like" ? 1 : 0,
      durationMs: Date.now() - swipeStart.current,
      context: swipeContext,
      relevanceRating: rating,
      ...(dir === "skip" && reason != null ? { swipeReason: reason as SwipePayload["swipeReason"] } : {}),
    };

    try { await api.post("/api/swipe", payload); } catch { /* silencieux */ }

    setTimeout(() => router.back(), 700);
  }

  // ── Loading ──
  if (!ready || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Erreur ──
  if (error || !movie) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6">
        <p className="text-text-secondary">{error || "Film introuvable."}</p>
        <button onClick={() => router.back()} className="text-sm text-secondary underline-offset-2 hover:underline">
          ← Retour
        </button>
      </div>
    );
  }

  const poster = posterUrl(movie.posterPath, "w342");
  const backdropSrc = posterUrl(movie.posterPath, "w1280");
  const year = movie.releaseDate?.slice(0, 4);
  const runtime = formatRuntime(movie.runtimeMinutes ?? null);

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* ── Hero backdrop ── */}
      <div className="relative w-full h-[52vw] max-h-[560px] min-h-[280px] overflow-hidden">
        {backdropSrc ? (
          <Image
            src={backdropSrc}
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-top opacity-30 blur-sm scale-105"
            priority
            aria-hidden
          />
        ) : (
          <div className="absolute inset-0 bg-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-bg-primary/40 to-bg-primary" />

        {/* Bouton retour */}
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-button border border-white/20 bg-black/30 backdrop-blur-sm px-3 py-2 text-sm text-white/80 transition-all hover:bg-black/50 hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Retour
        </button>
      </div>

      {/* ── Section identité ── */}
      <div className="relative z-10 px-4 sm:px-8 md:px-12 -mt-4">
        <div className="flex gap-5 md:gap-10 items-start">

          {/* Poster */}
          {poster && (
            <div className="flex-shrink-0 w-[clamp(80px,16vw,180px)]">
              <div className="relative aspect-[2/3] overflow-hidden rounded-card shadow-2xl border border-white/10">
                <Image src={poster} alt={movie.title} fill sizes="(max-width: 768px) 20vw, 180px" className="object-cover" />
              </div>
            </div>
          )}

          {/* Titre + actions */}
          <div className="flex-1 min-w-0 pt-3">
            <h1 className="font-display text-[clamp(1.25rem,3vw+0.5rem,3.5rem)] font-bold uppercase tracking-wide leading-tight text-text-primary">
              {movie.title}
            </h1>

            {/* Boutons swipe */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => !swipeDone && setPendingDir("like")}
                disabled={!!swipeDone}
                className={cn(
                  "flex items-center gap-1.5 rounded-button px-4 py-2 text-sm font-medium border transition-all",
                  swipeDone === "like"
                    ? "border-success bg-success/20 text-success"
                    : "border-success/50 bg-success/10 text-success hover:bg-success/20 disabled:opacity-40 disabled:pointer-events-none"
                )}
              >
                <svg className="h-4 w-4" fill={swipeDone === "like" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                </svg>
                {swipeDone === "like" ? "Aimé !" : "J'aime"}
              </button>

              <button
                onClick={() => !swipeDone && setPendingDir("skip")}
                disabled={!!swipeDone}
                className={cn(
                  "flex items-center gap-1.5 rounded-button px-4 py-2 text-sm font-medium border transition-all",
                  swipeDone === "skip"
                    ? "border-accent/60 bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-secondary hover:text-text-primary hover:border-border/60 disabled:opacity-40 disabled:pointer-events-none"
                )}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                {swipeDone === "skip" ? "Noté" : "Pas pour moi"}
              </button>
            </div>

            {/* Détails inline */}
            <div className="mt-6 border-t border-border/40" />
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              {year && <DetailRow label="Année">{year}</DetailRow>}
              {runtime && <DetailRow label="Durée">{runtime}</DetailRow>}
              {movie.tmdbRating > 0 && (
                <DetailRow label="Note TMDB">
                  <RatingStars rating={movie.tmdbRating} />
                </DetailRow>
              )}
              <DetailRow label="Statut">
                <span className={cn(
                  "rounded-pill px-2 py-0.5 text-xs font-medium border",
                  movie.isAvailable
                    ? "border-success/40 bg-success/10 text-success"
                    : "border-border bg-surface text-text-secondary"
                )}>
                  {movie.isAvailable ? "Disponible" : "Non disponible"}
                </span>
              </DetailRow>
              {movie.score != null && (
                <DetailRow label="Score SF">
                  <span className="font-bold text-secondary">{(movie.score * 100).toFixed(0)}%</span>
                </DetailRow>
              )}
              {(movie.genres?.length ?? 0) > 0 && (
                <DetailRow label="Genres">
                  <div className="flex flex-wrap gap-1.5">
                    {movie.genres.map((g) => (
                      <span key={g} className="rounded-pill border border-accent/20 bg-accent/10 px-2 py-0.5 text-[11px] text-accent/90">
                        {g}
                      </span>
                    ))}
                  </div>
                </DetailRow>
              )}
              {(movie.directors?.length ?? 0) > 0 && (
                <DetailRow label={movie.directors!.length > 1 ? "Réalisateurs" : "Réalisateur"}>
                  {movie.directors!.join(", ")}
                </DetailRow>
              )}
            </div>
          </div>
        </div>

        {/* ── Cast ── */}
        {(movie.castTop5?.length ?? 0) > 0 && (
          <>
            <div className="mt-8 border-t border-border/40" />
            <div className="mt-6">
              <p className="text-[clamp(1rem,2vw+0.5rem,2rem)] font-semibold text-text-primary mb-4">Cast</p>
              <div className="flex flex-wrap gap-4">
                {movie.castTop5!.map((name) => {
                  const credit = credits.find((c) => c.name === name);
                  return (
                    <div key={name} className="flex flex-col items-center gap-2 w-[72px] text-center">
                      {credit?.photo ? (
                        <img
                          src={credit.photo}
                          alt={name}
                          className="h-16 w-16 rounded-full border border-white/10 object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-surface-alt text-lg font-semibold text-text-secondary">
                          {name[0]}
                        </div>
                      )}
                      <span className="text-xs leading-tight text-text-primary">{name}</span>
                      {credit?.character && (
                        <span className="text-[10px] leading-tight text-text-secondary/70 line-clamp-1">{credit.character}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* ── Storyline ── */}
        {movie.overview && (
          <>
            <div className="mt-8 border-t border-border/40" />
            <div className="mt-6 pb-16">
              <p className="text-[clamp(1rem,2vw+0.5rem,2rem)] font-semibold text-text-primary mb-3">Storyline</p>
              <p className="text-[clamp(0.8rem,1vw+0.5rem,1.1rem)] leading-relaxed text-text-secondary max-w-4xl">
                {movie.overview}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Modal rating post-swipe ── */}
      {pendingDir && movie && (
        <RatingModal
          movie={movie}
          direction={pendingDir}
          onSubmit={confirmSwipe}
          onCancel={() => setPendingDir(null)}
        />
      )}
    </div>
  );
}

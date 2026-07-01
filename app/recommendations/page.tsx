"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { HomeSection, Movie } from "@/types";
import { cn } from "@/lib/utils";

type Filter = "All" | "AvailableOnly" | "UnavailableOnly";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "All", label: "Tous" },
  { value: "AvailableOnly", label: "Disponibles" },
  { value: "UnavailableOnly", label: "À découvrir" },
];

function posterUrl(path: string | null): string {
  if (!path) return "";
  if (path.startsWith("/")) return `https://image.tmdb.org/t/p/w500${path}`;
  if (path.startsWith("https://image.tmdb.org/")) return path;
  return "";
}

function MovieCard({ movie, onOpen }: { movie: Movie; onOpen: (id: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const url = posterUrl(movie.posterPath);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(movie.id)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(movie.id)}
      className="group cursor-pointer rounded-card overflow-hidden border border-border bg-surface transition-all hover:-translate-y-1 hover:border-border/60 hover:shadow-xl"
    >
      <div className="relative aspect-[2/3] bg-surface-alt">
        {url && !imgError ? (
          <Image
            src={url}
            alt={movie.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-10 w-10 text-text-secondary/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
          </div>
        )}
        {movie.score != null && (
          <span className="absolute top-2 right-2 rounded-button bg-secondary px-2 py-0.5 text-[10px] font-bold text-bg-primary">
            {(movie.score * 100).toFixed(0)}%
          </span>
        )}
        {movie.isAvailable && (
          <span className="absolute top-2 left-2 rounded-pill bg-success/90 px-2 py-0.5 text-[10px] font-semibold text-bg-primary">
            Disponible
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-display font-semibold text-text-primary line-clamp-1 text-sm">{movie.title}</p>
        <div className="mt-1 flex items-center gap-2 text-xs text-text-secondary">
          {movie.releaseDate && <span>{movie.releaseDate.slice(0, 4)}</span>}
          {movie.tmdbRating > 0 && (
            <>
              <span>·</span>
              <span className="text-warning">★ {movie.tmdbRating.toFixed(1)}</span>
            </>
          )}
        </div>
        {movie.genres && movie.genres.length > 0 && (
          <div className="mt-2 flex gap-1 flex-wrap">
            {movie.genres.slice(0, 2).map((g) => (
              <span key={g} className="rounded-pill border border-accent/20 bg-accent/10 px-2 py-0.5 text-[10px] text-accent">
                {g}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SectionRow({ section, onOpen }: { section: HomeSection; onOpen: (id: string) => void }) {
  return (
    <div className="mb-10">
      <h2 className="font-display mb-4 px-6 text-xl font-semibold text-text-primary md:px-12">
        {section.title}
      </h2>
      <div className="flex gap-4 overflow-x-auto px-6 pb-4 md:px-12 scrollbar-hide">
        {section.movies.map((movie) => (
          <div key={movie.id} className="w-40 flex-shrink-0 md:w-48">
            <MovieCard movie={movie} onOpen={onOpen} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="mb-10">
      <div className="mb-4 h-6 w-48 rounded-pill bg-surface-alt animate-pulse mx-6 md:mx-12" />
      <div className="flex gap-4 px-6 md:px-12">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="w-40 flex-shrink-0 md:w-48">
            <div className="aspect-[2/3] rounded-card bg-surface-alt animate-pulse" />
            <div className="mt-2 h-4 w-3/4 rounded-pill bg-surface-alt animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const router = useRouter();
  const { ready } = useAuthGuard();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("All");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get<HomeSection[]>(
        `/api/recommendations/home?countPerSection=20&availability=${filter}`
      );
      setSections(data ?? []);
    } catch (e: unknown) {
      if ((e as { status?: number }).status === 401) {
        router.replace("/onboarding");
        return;
      }
      setError("Impossible de charger les recommandations.");
    } finally {
      setLoading(false);
    }
  }, [filter, router]);

  useEffect(() => {
    if (!ready) return;
    load();
  }, [ready, load]);

  if (!ready) return null;

  const hero = sections[0]?.movies[0];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-border backdrop-blur-md" style={{ background: "var(--color-nav-bg)" }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-xl font-bold text-text-primary">
            Swipe<span className="text-accent">Film</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/recommendations" className="rounded-button bg-accent/10 px-4 py-2 text-sm font-medium text-accent">
              Recommandations
            </Link>
            <Link href="/swipe" className="rounded-button px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Swipe
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/account" className="rounded-button border border-border px-3 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors">
              Compte
            </Link>
            <Link
              href="/swipe"
              className="rounded-button bg-primary px-4 py-2 text-sm font-semibold text-text-primary transition-all hover:brightness-110"
            >
              Swiper →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero banner */}
      {hero && (
        <div className="relative h-72 overflow-hidden md:h-96">
          {hero.posterPath && (
            <Image
              src={posterUrl(hero.posterPath)}
              alt={hero.title}
              fill
              className="object-cover object-top opacity-30 blur-sm scale-110"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/60 to-transparent" />
          <div className="absolute bottom-0 px-6 pb-8 md:px-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-warning mb-2">Recommandé pour toi</p>
            <h1 className="font-display text-3xl font-bold text-text-primary md:text-5xl">{hero.title}</h1>
            {hero.overview && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary line-clamp-2">{hero.overview}</p>
            )}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex gap-2 px-6 py-5 md:px-12">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "rounded-pill border px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.value
                ? "border-accent bg-accent/15 text-accent"
                : "border-border text-text-secondary hover:text-text-primary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      {error && (
        <p className="px-6 py-8 text-center text-sm text-error md:px-12">{error}</p>
      )}
      {loading && Array.from({ length: 3 }).map((_, i) => <SectionSkeleton key={i} />)}
      {!loading && sections.map((s) => (
        <SectionRow key={s.id} section={s} onOpen={(id) => router.push(`/movies/${id}?from=recommendations`)} />
      ))}
      {!loading && !error && sections.length === 0 && (
        <div className="px-6 py-20 text-center">
          <p className="text-text-secondary mb-4">Aucune recommandation disponible.</p>
          <p className="text-sm text-text-secondary">
            Swipe quelques films pour entraîner ton profil.
          </p>
          <Link href="/swipe" className="mt-6 inline-block rounded-button bg-primary px-6 py-3 text-sm font-semibold text-text-primary hover:brightness-110 transition-all">
            Aller swiper →
          </Link>
        </div>
      )}
    </div>
  );
}

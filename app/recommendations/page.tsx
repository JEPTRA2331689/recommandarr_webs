"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/useAuthGuard";
import type { HomeSection, Movie } from "@/types";
import { cn, posterUrl } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { PosterCard } from "@/components/PosterCard";

type Filter = "All" | "AvailableOnly" | "UnavailableOnly";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "All", label: "Tous" },
  { value: "AvailableOnly", label: "Disponibles" },
  { value: "UnavailableOnly", label: "À découvrir" },
];

// ── Icônes locales ───────────────────────────────────────────────────────────

function IcoInfo() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

function IcoPlay() {
  return (
    <svg className="h-5 w-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

// ── Rangée horizontale scrollable ─────────────────────────────────────────────

function SectionRow({ section, onOpen }: { section: HomeSection; onOpen: (id: string) => void }) {
  return (
    <div className="mb-10">
      <h2 className="mb-3 px-6 md:px-12 text-base font-semibold text-text-primary tracking-wide font-display">
        {section.title}
      </h2>
      <div
        className="flex gap-3 overflow-x-auto h-auto px-6 md:px-12 pb-3 snap-x snap-mandatory"
        style={{ scrollbarWidth: "auto" }}
      >
        {section.movies.map((movie) => (
            <PosterCard key={movie.id} movie={movie} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// ── Squelettes ────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="relative min-h-[65vh] flex items-end overflow-hidden bg-surface">
      <div className="absolute inset-0 bg-gradient-to-t from-bg-primary via-bg-primary/30 to-transparent" />
      <div className="relative z-10 px-6 pb-12 pt-32 md:px-12 md:pb-16 space-y-4 w-full max-w-lg">
        <div className="h-3 w-20 rounded-pill bg-surface-alt animate-pulse" />
        <div className="h-10 w-72 rounded-card bg-surface-alt animate-pulse" />
        <div className="h-3 w-44 rounded-pill bg-surface-alt animate-pulse" />
        <div className="h-14 w-64 rounded-card bg-surface-alt animate-pulse" />
        <div className="flex gap-3 pt-2">
          <div className="h-11 w-32 rounded-button bg-surface-alt animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-surface-alt animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="mb-10">
      <div className="mb-3 h-4 w-44 rounded-pill bg-surface-alt animate-pulse mx-6 md:mx-12" />
      <div className="flex gap-3 px-6 md:px-12 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[165px]">
            <div className="aspect-[2/3] rounded-card bg-surface-alt animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const hero: Movie | undefined = sections[0]?.movies[0];

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">

      {/* ── NAVBAR ── */}
      <Navbar activePage="recommendations" variant="overlay" />

      {/* ── HERO ── */}
      {loading && !hero ? (
        <HeroSkeleton />
      ) : hero ? (
        <section className="relative flex min-h-[65vh] items-end overflow-hidden">
          {/* Image de fond */}
          {hero.posterPath && (
            <Image
              src={posterUrl(hero.posterPath, "w1280")}
              alt=""
              fill
              className="object-cover object-top scale-[1.03]"
              priority
              aria-hidden
            />
          )}

          {/* Gradients : côté gauche + bas vers bg-primary */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(10,19,13,0.97) 20%, rgba(10,19,13,0.6) 55%, rgba(10,19,13,0.1) 100%), " +
                "linear-gradient(to top, rgba(10,19,13,1) 0%, rgba(10,19,13,0.55) 25%, transparent 55%)",
            }}
          />

          {/* Contenu hero */}
          <div className="relative z-10 w-full max-w-2xl px-6 pb-14 pt-36 md:px-12 md:pb-20">

            {/* Genre */}
            {(hero.genres?.length ?? 0) > 0 && (
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
                {hero.genres.slice(0, 3).join(" / ")}
              </p>
            )}

            {/* Titre */}
            <h1
              className="font-display font-black uppercase leading-none tracking-[-0.02em] text-text-primary"
              style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
            >
              {hero.title}
            </h1>

            {/* Méta */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
              {hero.releaseDate && <span>{hero.releaseDate.slice(0, 4)}</span>}
              {hero.runtimeMinutes != null && <span>{hero.runtimeMinutes} min</span>}
              {hero.tmdbRating > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-warning">★</span>
                  {hero.tmdbRating.toFixed(1)}
                </span>
              )}
              {hero.isAvailable && (
                <span className="rounded-pill border border-success/40 bg-success/12 px-3 py-0.5 text-xs font-semibold text-success">
                  Disponible
                </span>
              )}
            </div>

            {/* Overview */}
            {hero.overview && (
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-text-secondary line-clamp-3 md:line-clamp-4">
                {hero.overview}
              </p>
            )}

            {/* CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push(`/movies/${hero.id}?from=recommendations`)}
                className="cursor-pointer flex items-center gap-2 rounded-button bg-secondary px-7 py-3 text-sm font-bold text-bg-primary shadow-[0_0_24px_rgba(212,169,74,0.3)] transition-all hover:brightness-110 active:scale-[0.97]"
              >
                <IcoPlay />
                Regarder
              </button>
              <button
                onClick={() => router.push(`/movies/${hero.id}?from=recommendations`)}
                aria-label="Plus d'infos"
                className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border-2 border-border bg-surface/60 text-text-primary backdrop-blur-sm transition-all hover:bg-surface hover:border-secondary/40"
              >
                <IcoInfo />
              </button>
            </div>
          </div>

          {/* Fondu bas vers bg-primary */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-bg-primary to-transparent" />
        </section>
      ) : null}

      {/* ── FILTRES ── */}
      <div className="flex items-center gap-2 px-6 py-5 md:px-12">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "cursor-pointer rounded-pill border px-4 py-1.5 text-xs font-semibold transition-all duration-150",
              filter === f.value
                ? "border-secondary bg-secondary text-bg-primary"
                : "border-border text-text-secondary hover:border-secondary/40 hover:text-text-primary"
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-text-secondary/60">
          {!loading && sections.length > 0 &&
            `${sections.reduce((n, s) => n + s.movies.length, 0)} films`}
        </div>
      </div>

      {/* ── RANGÉES ── */}
      <div className="pb-28 md:pb-20">
        {error && (
          <p className="px-6 py-10 text-center text-sm text-error md:px-12">{error}</p>
        )}

        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SectionSkeleton key={i} />)
          : sections.map((s) => (
            <SectionRow
              key={s.id}
              section={s}
              onOpen={(id) => router.push(`/movies/${id}?from=recommendations`)}
            />
          ))}

        {!loading && !error && sections.length === 0 && (
          <div className="flex flex-col items-center px-6 py-28 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface border border-border">
              <svg className="h-9 w-9 text-text-secondary/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0 1 12 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0c0 .621.504 1.125 1.125 1.125h15.75c.621 0 1.125-.504 1.125-1.125" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-text-primary mb-2">Aucune recommandation</p>
            <p className="text-sm text-text-secondary mb-8 max-w-xs">
              Swipe quelques films pour que le moteur apprenne tes goûts.
            </p>
            <Link
              href="/swipe"
              className="inline-flex items-center gap-2 rounded-button bg-secondary px-8 py-3 text-sm font-bold text-bg-primary transition-all hover:brightness-110"
            >
              <IcoPlay />
              Aller swiper
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

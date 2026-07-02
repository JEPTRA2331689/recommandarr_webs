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

function posterUrl(path: string | null, size = "w500"): string {
  if (!path) return "";
  if (path.startsWith("/")) return `https://image.tmdb.org/t/p/${size}${path}`;
  if (path.startsWith("https://image.tmdb.org/")) return path;
  return "";
}

// ── Icônes ────────────────────────────────────────────────────────────────────

function IcoPlay({ className }: { className?: string }) {
  return (
    <svg className={cn("h-5 w-5 ml-0.5", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function IcoInfo() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
    </svg>
  );
}

function IcoSearch() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

// ── Carte film paysage (16:9) ─────────────────────────────────────────────────

function MovieCard({ movie, onOpen }: { movie: Movie; onOpen: (id: string) => void }) {
  const [imgError, setImgError] = useState(false);
  const url = posterUrl(movie.posterPath, "w500");

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(movie.id)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(movie.id)}
      className="group relative flex-shrink-0 w-[220px] md:w-[260px] lg:w-[290px] cursor-pointer snap-start"
    >
      {/* Zone image paysage */}
      <div className="relative aspect-video overflow-hidden rounded-[6px] bg-[#1c1c1c] transition-all duration-200 group-hover:scale-[1.04] group-hover:shadow-[0_20px_60px_rgba(0,0,0,0.9)] group-hover:z-10">

        {url && !imgError ? (
          <Image
            src={url}
            alt={movie.title}
            fill
            className="object-cover object-top"
            sizes="(max-width: 768px) 240px, 300px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-10 w-10 text-white/10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
          </div>
        )}

        {/* Gradient bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/5 to-transparent" />

        {/* Badges */}
        {movie.score != null && (
          <div className="absolute top-2 right-2 rounded-[4px] bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-bg-primary">
            {(movie.score * 100).toFixed(0)}%
          </div>
        )}
        {movie.isAvailable && (
          <div className="absolute top-2 left-2 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-semibold text-bg-primary">
            Dispo
          </div>
        )}

        {/* Bouton play au hover */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-2xl">
            <IcoPlay className="text-black" />
          </div>
        </div>

        {/* Titre + meta en bas */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-white drop-shadow-md line-clamp-1">
            {movie.title}
          </p>
          <div className="mt-0.5 flex items-center gap-1.5">
            {movie.releaseDate && (
              <span className="text-[10px] text-white/50">{movie.releaseDate.slice(0, 4)}</span>
            )}
            {movie.tmdbRating > 0 && (
              <>
                <span className="text-white/30 text-[10px]">·</span>
                <span className="text-[10px] text-warning">★ {movie.tmdbRating.toFixed(1)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rangée horizontale ────────────────────────────────────────────────────────

function SectionRow({ section, onOpen }: { section: HomeSection; onOpen: (id: string) => void }) {
  return (
    <div className="mb-10">
      <h2 className="mb-3 px-6 md:px-12 text-base font-semibold text-white tracking-wide">
        {section.title}
      </h2>
      <div
        className="flex gap-2.5 overflow-x-auto px-6 md:px-12 pb-3 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {section.movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onOpen={onOpen} />
        ))}
      </div>
    </div>
  );
}

// ── Squelettes ────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="relative min-h-[68vh] flex items-end overflow-hidden bg-[#111]">
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/30 to-transparent" />
      <div className="relative z-10 px-6 pb-12 pt-32 md:px-12 md:pb-16 space-y-4 w-full max-w-lg">
        <div className="h-3 w-24 rounded bg-white/10 animate-pulse" />
        <div className="h-12 w-80 rounded bg-white/10 animate-pulse" />
        <div className="h-4 w-48 rounded bg-white/10 animate-pulse" />
        <div className="h-16 w-72 rounded bg-white/10 animate-pulse" />
        <div className="flex gap-3 pt-2">
          <div className="h-11 w-32 rounded-[6px] bg-white/10 animate-pulse" />
          <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="mb-10">
      <div className="mb-3 h-4 w-44 rounded bg-white/10 animate-pulse mx-6 md:mx-12" />
      <div className="flex gap-2.5 px-6 md:px-12 overflow-hidden">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-[260px]">
            <div className="aspect-video rounded-[6px] bg-white/[0.06] animate-pulse" />
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
  const [scrolled, setScrolled] = useState(false);

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

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  if (!ready) return null;

  const hero: Movie | undefined = sections[0]?.movies[0];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* ── NAVBAR ── */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#0a0a0a]/96 backdrop-blur-md shadow-[0_1px_0_rgba(255,255,255,0.06)]"
          : "bg-gradient-to-b from-black/80 to-transparent"
      )}>
        <div className="flex h-16 items-center justify-between px-6 md:px-12">
          {/* Logo */}
          <Link
            href="/"
            className="select-none font-display text-xl font-bold tracking-tight text-white"
          >
            Recomm<span className="text-secondary">andarr</span>
          </Link>

          {/* Nav centrale */}
          <nav className="hidden md:flex items-center gap-7">
            <Link
              href="/recommendations"
              className="text-sm font-semibold text-white transition-colors"
            >
              Recommandations
            </Link>
            <Link
              href="/swipe"
              className="text-sm font-medium text-white/55 hover:text-white transition-colors"
            >
              Swipe
            </Link>
          </nav>

          {/* Droite */}
          <div className="flex items-center gap-4">
            <button
              aria-label="Rechercher"
              className="cursor-pointer text-white/60 hover:text-white transition-colors"
            >
              <IcoSearch />
            </button>
            <Link
              href="/account"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-bold text-white ring-2 ring-transparent hover:ring-white/30 transition-all"
              aria-label="Mon compte"
            >
              R
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      {loading && !hero ? (
        <HeroSkeleton />
      ) : hero ? (
        <section className="relative flex min-h-[68vh] items-end overflow-hidden">
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

          {/* Double gradient : côté gauche sombre + bas sombre */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(0,0,0,0.95) 25%, rgba(0,0,0,0.55) 60%, rgba(0,0,0,0.1) 100%), " +
                "linear-gradient(to top, rgba(10,10,10,1) 0%, rgba(10,10,10,0.5) 25%, transparent 55%)",
            }}
          />

          {/* Contenu */}
          <div className="relative z-10 w-full max-w-2xl px-6 pb-14 pt-36 md:px-12 md:pb-20">

            {/* Genre */}
            {(hero.genres?.length ?? 0) > 0 && (
              <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.2em] text-secondary">
                {hero.genres!.slice(0, 3).join(" / ")}
              </p>
            )}

            {/* Titre */}
            <h1
              className="font-display font-black uppercase leading-none tracking-[-0.02em] text-white"
              style={{ fontSize: "clamp(2rem, 6vw, 4.5rem)" }}
            >
              {hero.title}
            </h1>

            {/* Méta */}
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-white/60">
              {hero.releaseDate && <span>{hero.releaseDate.slice(0, 4)}</span>}
              {hero.runtimeMinutes != null && (
                <span>{hero.runtimeMinutes} min</span>
              )}
              {hero.tmdbRating > 0 && (
                <span className="flex items-center gap-1">
                  <span className="text-warning">★</span>
                  {hero.tmdbRating.toFixed(1)}
                </span>
              )}
              {hero.isAvailable && (
                <span className="rounded-full border border-success/40 bg-success/12 px-3 py-0.5 text-xs font-semibold text-success">
                  Disponible
                </span>
              )}
            </div>

            {/* Overview */}
            {hero.overview && (
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/65 line-clamp-3 md:line-clamp-4">
                {hero.overview}
              </p>
            )}

            {/* CTA */}
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push(`/movies/${hero.id}?from=recommendations`)}
                className="cursor-pointer flex items-center gap-2 rounded-[6px] bg-secondary px-7 py-3 text-sm font-bold text-[#0a0a0a] shadow-[0_0_24px_rgba(212,169,74,0.35)] transition-all hover:brightness-110 active:scale-[0.97]"
              >
                <IcoPlay className="text-[#0a0a0a]" />
                Regarder
              </button>
              <button
                onClick={() => router.push(`/movies/${hero.id}?from=recommendations`)}
                aria-label="Plus d'infos"
                className="cursor-pointer flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/40 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/60"
              >
                <IcoInfo />
              </button>
            </div>
          </div>

          {/* Fondu bas → fond noir */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </section>
      ) : null}

      {/* ── FILTRES ── */}
      <div className="flex items-center gap-2 px-6 py-5 md:px-12">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-1.5 text-xs font-semibold transition-all duration-150",
              filter === f.value
                ? "border-white bg-white text-black"
                : "border-white/20 text-white/55 hover:border-white/40 hover:text-white"
            )}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto text-xs text-white/30">
          {!loading && sections.length > 0 && `${sections.reduce((n, s) => n + s.movies.length, 0)} films`}
        </div>
      </div>

      {/* ── RANGÉES ── */}
      <div className="pb-20">
        {error && (
          <p className="px-6 py-10 text-center text-sm text-red-400 md:px-12">{error}</p>
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
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/[0.05]">
              <svg className="h-9 w-9 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125c0-2.625 2.625-2.625 2.625-5.25s-2.625-2.625-2.625-5.25 2.625-2.625 2.625-5.25S2.25 1.5 5.25 1.5m13.5 0c-3.498 0-5.25 3.498-5.25 6.75S18.75 15 18.75 18.375c0 .621-.504 1.125-1.125 1.125m1.5-18.375a1.125 1.125 0 0 0-1.125 1.125M3.375 19.5" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-white mb-2">Aucune recommandation</p>
            <p className="text-sm text-white/40 mb-8 max-w-xs">
              Swipe quelques films pour que le moteur apprenne tes goûts.
            </p>
            <Link
              href="/swipe"
              className="inline-flex items-center gap-2 rounded-[6px] bg-secondary px-8 py-3 text-sm font-bold text-[#0a0a0a] transition-all hover:brightness-110"
            >
              <IcoPlay className="text-[#0a0a0a]" />
              Aller swiper
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

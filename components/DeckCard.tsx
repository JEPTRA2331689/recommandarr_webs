"use client";

import Image from "next/image";
import { posterUrl, cn } from "@/lib/utils";
import type { Movie } from "@/types";

interface DeckCardProps {
  movie: Movie | undefined;
  /** Position relative au centre : -2 -1 0 +1 +2 */
  order: number;
  /** Direction de sortie, seulement pour la carte centrale (order === 0) */
  exitDir: "left" | "right" | null;
  onClick?: () => void;
}

/**
 * Carte du deck de swipe.
 * La carte d'ordre 0 est la carte centrale (grande, interactive).
 * Les autres sont positionnées en perspective (± translateX + scale).
 */
export function DeckCard({ movie, order, exitDir, onClick }: DeckCardProps) {
  if (!movie) return null;

  const isCenter = order === 0;
  const absOrder = Math.abs(order);

  const translateX = order * 260;
  const scale      = isCenter ? 1 : absOrder === 1 ? 0.855 : 0.70;
  const opacity    = isCenter ? 1 : absOrder === 1 ? 0.55 : 0.25;
  const zIndex     = 30 - absOrder * 10;

  const exitTransform = exitDir === "right"
    ? "translateX(620px) rotate(18deg) scale(0.88)"
    : exitDir === "left"
    ? "translateX(-620px) rotate(-18deg) scale(0.88)"
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
          "h-[50vh] aspect-[2/3]",
          isCenter && "cursor-pointer shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
        )}
      >
        {/* Poster */}
        {movie.posterPath ? (
          <Image
            src={posterUrl(movie.posterPath, isCenter ? "w780" : "w500")}
            alt={movie.title}
            fill
            className="object-cover"
            priority={isCenter}
            sizes="(max-width: 768px) 34vw, 340px"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-surface-alt px-4 text-center">
            <svg className="h-12 w-12 text-text-secondary/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
            <span className="text-xs text-text-secondary line-clamp-3">{movie.title}</span>
          </div>
        )}

        {/* Gradient bas */}
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

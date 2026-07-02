"use client";

import { useState } from "react";
import Image from "next/image";
import { posterUrl, cn } from "@/lib/utils";
import type { Movie } from "@/types";

interface PosterCardProps {
  movie: Movie;
  onOpen: (id: string) => void;
}

/** Carte film en format portrait 2:3, utilisée dans les rangées horizontales. */
export function PosterCard({ movie, onOpen }: PosterCardProps) {
  const [imgError, setImgError] = useState(false);
  const url = posterUrl(movie.posterPath, "original");

  

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(movie.id)}
      onKeyDown={(e) => e.key === "Enter" && onOpen(movie.id)}
      className="group relative flex-shrink-0 aspect-[2/3] cursor-pointer snap-start overflow-hidden rounded-card transition-all duration-200 hover:scale-[1.03] hover:shadow-[0_16px_40px_rgba(0,0,0,0.7)] hover:ring-1 hover:ring-secondary/40"
      style={{ width: "clamp(10rem, 15vw, 20rem)" }}
    >

        {url && !imgError ? (
          <Image
            src={url}
            alt={movie.title}
            fill
            className="object-cover object-center"
            sizes=""
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 bg-surface-alt px-3 text-center">
            <svg className="h-8 w-8 text-text-secondary/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25z" />
            </svg>
            <span className="text-[10px] font-medium text-text-secondary line-clamp-3">{movie.title}</span>
          </div>
        )}

        {/* Gradient bas */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

        {/* Badge score */}
        {movie.score != null && (
          <div className="absolute top-2 right-2 rounded-pill bg-secondary px-1.5 py-0.5 text-[clamp(0.75rem,0.75vw+0.2rem,2.5rem)] font-bold text-bg-primary">
            {(movie.score * 100).toFixed(0)}%
          </div>
        )}

        {/* Badge disponible */}
        {movie.isAvailable && (
          <div className="absolute top-2 left-2 rounded-pill bg-success/90 px-2 py-0.5 text-[clamp(0.75rem,0.75vw+0.2rem,2.5rem)] font-semibold text-bg-primary">
            Dispo
          </div>
        )}

        {/* Titre + année */}
        <div className="absolute bottom-0 left-0 right-0 p-2.5">
          <p className="text-[clamp(1rem,0.75vw+0.2rem,3rem)] font-semibold text-text-primary drop-shadow-md line-clamp-2 leading-tight">
            {movie.title}
          </p>
          {movie.releaseDate && (
            <p className="mt-0.5 text-[clamp(0.80rem,0.65vw+0.2rem,3rem)] text-text-secondary/80">
              {movie.releaseDate.slice(0, 4)}
            </p>
          )}
        </div>
    </div>
  );
}

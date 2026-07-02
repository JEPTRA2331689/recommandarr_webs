"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Movie, SwipePayload } from "@/types";

const SKIP_REASONS = [
  { value: 1, label: "Déjà vu" },
  { value: 2, label: "Pas mon genre" },
  { value: 3, label: "Pas d'humeur" },
  { value: 4, label: "Mauvaise note" },
  { value: 0, label: "Autre" },
] as const;

interface RatingModalProps {
  movie: Movie;
  direction: "like" | "skip";
  onSubmit: (rating: number, reason?: SwipePayload["swipeReason"]) => void;
  onCancel?: () => void;
}

/** Modal de notation post-swipe : pertinence (1-10) + raison si skip. */
export function RatingModal({ movie, direction, onSubmit, onCancel }: RatingModalProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [reason, setReason] = useState<number | null>(null);
  const canSubmit = rating !== null && (direction === "like" || reason !== null);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 md:items-center">
      <div className="relative w-full max-w-sm rounded-sheet border border-border bg-surface p-6">

        {/* En-tête */}
        <div className="mb-4 flex items-center gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors"
              aria-label="Fermer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
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
          <div className="flex flex-wrap gap-1.5">
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

        {/* Raison (skip seulement) */}
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
          onClick={() => canSubmit && onSubmit(rating!, reason != null ? (reason as SwipePayload["swipeReason"]) : undefined)}
          disabled={!canSubmit}
          className="w-full cursor-pointer rounded-button bg-primary py-3 text-sm font-semibold text-text-primary transition-all hover:brightness-110 disabled:opacity-40 disabled:pointer-events-none"
        >
          Valider
        </button>
      </div>
    </div>
  );
}

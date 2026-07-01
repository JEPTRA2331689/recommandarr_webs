export interface Movie {
  id: string;
  tmdbId: number;
  title: string;
  posterPath: string | null;
  overview: string | null;
  tmdbRating: number;
  runtimeMinutes: number | null;
  genres: string[];
  releaseDate: string | null;
  isAvailable: boolean;
  score?: number;
  castTop5?: string[];
  directors?: string[];
}

export interface HomeSection {
  id: string;
  title: string;
  movies: Movie[];
}

export interface BetaImportResult {
  accessKey: string;
  totalItems: number;
  watchedMovies: number;
  message: string;
}

export interface BetaLoginResult {
  token: string;
  accessKey: string;
}

export interface EngineMetrics {
  pearsonCorrelation: number | null;
  mae: number | null;
  bias: number | null;
  totalSwipes: number;
  swipesForReliableMetrics: number;
  coldStartProgress: number;
}

export interface BetaKeyStats {
  totalKeys: number;
  activeKeys: number;
  remainingSlots: number;
}

// SwipeDirection enum: 0 = Left (skip), 1 = Right (like)
export type SwipeDirection = 0 | 1;

// SwipeReason enum: 0=autre, 1=déjà vu, 2=pas mon genre, 3=pas d'humeur, 4=mauvaise note
export type SwipeReason = 0 | 1 | 2 | 3 | 4;

// SwipeContext enum: 0=default, 1=swipe_page, 2=recommendations, 3=discover, 4=search
export type SwipeContext = 0 | 1 | 2 | 3 | 4;

export interface SwipePayload {
  movieId: string;
  direction: SwipeDirection;
  durationMs: number;
  context: SwipeContext;
  relevanceRating?: number;
  swipeReason?: SwipeReason;
}

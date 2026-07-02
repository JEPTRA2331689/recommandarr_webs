import { NextRequest, NextResponse } from "next/server";

const TMDB = "https://api.themoviedb.org/3";
const IMG  = "https://image.tmdb.org/t/p";

type RawMovie = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genre_ids: number[];
};

type RawPerson = { name: string; profile_path: string | null };

export async function GET(req: NextRequest) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return NextResponse.json([], { status: 503 });

  const lang = req.nextUrl.searchParams.get("language") ?? "en-US";

  try {
    const [trendRes, genreRes] = await Promise.all([
      fetch(`${TMDB}/trending/movie/week?language=${lang}&api_key=${key}`, {
        next: { revalidate: 3600 },
      }),
      fetch(`${TMDB}/genre/movie/list?language=${lang}&api_key=${key}`, {
        next: { revalidate: 86400 },
      }),
    ]);

    if (!trendRes.ok) return NextResponse.json([], { status: 502 });

    const [{ results }, genreData] = await Promise.all([
      trendRes.json() as Promise<{ results: RawMovie[] }>,
      genreRes.json() as Promise<{ genres?: { id: number; name: string }[] }>,
    ]);

    const genreMap: Record<number, string> = Object.fromEntries(
      (genreData.genres ?? []).map((g) => [g.id, g.name])
    );

    const movies = await Promise.all(
      (results ?? []).slice(0, 6).map(async (m) => {
        let cast: { name: string; photo: string | null }[] = [];
        try {
          const cr = await fetch(
            `${TMDB}/movie/${m.id}/credits?language=${lang}&api_key=${key}`,
            { next: { revalidate: 3600 } }
          );
          const { cast: raw } = (await cr.json()) as { cast?: RawPerson[] };
          cast = (raw ?? []).slice(0, 5).map((a) => ({
            name: a.name,
            photo: a.profile_path ? `${IMG}/w185${a.profile_path}` : null,
          }));
        } catch { /* ignore */ }

        return {
          id: m.id,
          title: m.title,
          overview: m.overview,
          year: m.release_date?.slice(0, 4) ?? "",
          poster: m.poster_path    ? `${IMG}/w342${m.poster_path}`    : null,
          backdrop: m.backdrop_path ? `${IMG}/w780${m.backdrop_path}` : null,
          score: Math.round(m.vote_average * 10),
          genres: (m.genre_ids ?? []).slice(0, 3).map((id) => genreMap[id]).filter(Boolean),
          cast,
        };
      })
    );

    return NextResponse.json(movies, {
      headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch {
    return NextResponse.json([], { status: 502 });
  }
}

import { NextRequest, NextResponse } from "next/server";

const TMDB = "https://api.themoviedb.org/3";

export async function GET(req: NextRequest) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return NextResponse.json(null, { status: 503 });

  const id   = req.nextUrl.searchParams.get("id");
  const lang = req.nextUrl.searchParams.get("language") ?? "en-US";
  if (!id) return NextResponse.json(null, { status: 400 });

  try {
    const res = await fetch(
      `${TMDB}/movie/${id}?language=${lang}&api_key=${key}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json(null, { status: 502 });

    const d = await res.json() as {
      title?: string;
      overview?: string;
      poster_path?: string | null;
      genres?: { id: number; name: string }[];
    };

    return NextResponse.json(
      {
        title:      d.title      ?? null,
        overview:   d.overview   ?? null,
        posterPath: d.poster_path ?? null,
        genres:     (d.genres ?? []).map((g) => g.name),
      },
      { headers: { "cache-control": "public, s-maxage=86400" } }
    );
  } catch {
    return NextResponse.json(null, { status: 502 });
  }
}

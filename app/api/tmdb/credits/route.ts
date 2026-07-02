import { NextRequest, NextResponse } from "next/server";

const TMDB = "https://api.themoviedb.org/3";
const IMG  = "https://image.tmdb.org/t/p";

export async function GET(req: NextRequest) {
  const key = process.env.TMDB_API_KEY;
  if (!key) return NextResponse.json({ cast: [] }, { status: 503 });

  const id   = req.nextUrl.searchParams.get("id");
  const lang = req.nextUrl.searchParams.get("language") ?? "en-US";
  if (!id) return NextResponse.json({ cast: [] }, { status: 400 });

  try {
    const res = await fetch(
      `${TMDB}/movie/${id}/credits?language=${lang}&api_key=${key}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return NextResponse.json({ cast: [] }, { status: 502 });

    const { cast } = (await res.json()) as {
      cast?: { id: number; name: string; character: string; profile_path: string | null }[];
    };

    return NextResponse.json(
      {
        cast: (cast ?? []).slice(0, 10).map((a) => ({
          id: a.id,
          name: a.name,
          character: a.character,
          photo: a.profile_path ? `${IMG}/w185${a.profile_path}` : null,
        })),
      },
      { headers: { "cache-control": "public, s-maxage=86400" } }
    );
  } catch {
    return NextResponse.json({ cast: [] }, { status: 502 });
  }
}

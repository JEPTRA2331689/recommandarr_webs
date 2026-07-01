import { NextRequest, NextResponse } from "next/server";

const BACKEND = process.env.BACKEND_URL ?? "https://recommandarr-production.up.railway.app";

const FORWARD_RES_HEADERS = ["set-cookie", "location", "www-authenticate", "retry-after"];

async function proxy(
  req: NextRequest,
  params: Promise<{ path: string[] }>
): Promise<NextResponse> {
  const { path } = await params;
  const encodedPath = path.map(encodeURIComponent).join("/");
  const url = `${BACKEND}/${encodedPath}${req.nextUrl.search}`;

  const headers = new Headers();
  const auth = req.headers.get("authorization");
  if (auth) headers.set("authorization", auth);
  const ct = req.headers.get("content-type");
  if (ct) headers.set("content-type", ct);

  const hasBody = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const body = hasBody ? await req.arrayBuffer() : undefined;

  let res: Response;
  try {
    res = await fetch(url, { method: req.method, headers, body });
  } catch {
    return new NextResponse('{"error":"upstream_unavailable"}', {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  const resHeaders = new Headers();
  const contentType = res.headers.get("content-type");
  if (contentType) resHeaders.set("content-type", contentType);
  for (const h of FORWARD_RES_HEADERS) {
    const val = res.headers.get(h);
    if (val) resHeaders.set(h, val);
  }

  return new NextResponse(res.body, { status: res.status, headers: resHeaders });
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return proxy(req, params);
}

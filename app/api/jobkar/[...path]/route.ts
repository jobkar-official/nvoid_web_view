import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  nvoidRefreshCookie,
  nvoidSessionCookie,
  nvoidUserCookie,
  parseAuthenticatedResponse
} from "../../../../lib/auth-session";

const ACCESS_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

function apiBase() {
  return (
    process.env.NVOID_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://edge.jobkar.in"
  ).replace(/\/+$/, "");
}

function chatBase() {
  return (process.env.NEXT_PUBLIC_SOCKET_URL || "https://chat.jobkar.in")
    .replace(/^wss:/, "https:")
    .replace(/^ws:/, "http:")
    .replace(/\/+$/, "");
}

function tokenFrom(value: unknown): string {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : {};
  const result = root.result && typeof root.result === "object" ? root.result as Record<string, unknown> : {};
  const nested = data.data && typeof data.data === "object" ? data.data as Record<string, unknown> : {};
  return String(root.accessToken || root.access_token || root.token || data.accessToken || data.access_token || data.token || result.accessToken || result.access_token || nested.accessToken || nested.access_token || "");
}

function refreshFrom(value: unknown): string {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const data = root.data && typeof root.data === "object" ? root.data as Record<string, unknown> : {};
  const result = root.result && typeof root.result === "object" ? root.result as Record<string, unknown> : {};
  return String(root.refreshToken || root.refresh_token || data.refreshToken || data.refresh_token || result.refreshToken || result.refresh_token || "");
}

async function upstreamFetch(url: URL, method: string, headers: Headers, body: ArrayBuffer | undefined, token: string) {
  const outgoing = new Headers();
  const contentType = headers.get("content-type");
  const accept = headers.get("accept");
  if (contentType) outgoing.set("content-type", contentType);
  if (accept) outgoing.set("accept", accept);
  outgoing.set("authorization", "Bearer " + token);
  return fetch(url, {
    method,
    headers: outgoing,
    body: method === "GET" || method === "HEAD" ? undefined : body,
    cache: "no-store",
    signal: AbortSignal.timeout(30000)
  });
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path: segments = [] } = await context.params;
  if (!segments.length) return NextResponse.json({ error: "An API path is required." }, { status: 400 });

  const isChat = segments[0] === "chat";
  const upstreamPath = (isChat ? segments.slice(1) : segments).join("/");
  if (!upstreamPath) return NextResponse.json({ error: "An API path is required." }, { status: 400 });

  const cookiesStore = await cookies();
  let accessToken = cookiesStore.get(nvoidSessionCookie)?.value || "";
  const refreshToken = cookiesStore.get(nvoidRefreshCookie)?.value || "";
  const userValue = cookiesStore.get(nvoidUserCookie)?.value || "";
  let email = "";
  try {
    const saved = JSON.parse(userValue);
    email = String(saved?.user?.email || saved?.email || "");
  } catch {}

  if (!accessToken) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

  const base = isChat ? chatBase() : apiBase();
  const target = new URL(upstreamPath + request.nextUrl.search, base + "/");
  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();

  let upstream = await upstreamFetch(target, method, request.headers, body, accessToken);
  let rotatedRefreshToken = "";
  let refreshed = false;

  if (upstream.status === 401 && refreshToken && email && !upstreamPath.toLowerCase().includes("refreshtoken")) {
    try {
      const refreshUrl = new URL("/backend/auth/refreshToken", apiBase());
      const refreshResponse = await fetch(refreshUrl, {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ email, refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });
      const refreshPayload = await refreshResponse.json().catch(() => ({}));
      const nextAccess = tokenFrom(refreshPayload);
      if (refreshResponse.ok && nextAccess) {
        accessToken = nextAccess;
        rotatedRefreshToken = refreshFrom(refreshPayload) || refreshToken;
        refreshed = true;
        upstream = await upstreamFetch(target, method, request.headers, body, accessToken);
      }
    } catch {}
  }

  const responseBody = await upstream.arrayBuffer();
  const responseHeaders = new Headers();
  const contentType = upstream.headers.get("content-type");
  const disposition = upstream.headers.get("content-disposition");
  if (contentType) responseHeaders.set("content-type", contentType);
  if (disposition) responseHeaders.set("content-disposition", disposition);
  responseHeaders.set("cache-control", "no-store");
  const response = new NextResponse(responseBody, { status: upstream.status, headers: responseHeaders });

  if (refreshed) {
    response.cookies.set(nvoidSessionCookie, accessToken, ACCESS_OPTIONS);
    response.cookies.set(nvoidRefreshCookie, rotatedRefreshToken, ACCESS_OPTIONS);
  } else if (upstream.status === 401) {
    response.cookies.set(nvoidSessionCookie, "", { ...ACCESS_OPTIONS, maxAge: 0 });
    response.cookies.set(nvoidRefreshCookie, "", { ...ACCESS_OPTIONS, maxAge: 0 });
    response.cookies.set(nvoidUserCookie, "", { ...ACCESS_OPTIONS, maxAge: 0 });
  }

  return response;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

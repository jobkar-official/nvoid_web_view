import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  nvoidRefreshCookie,
  nvoidSessionCookie,
  nvoidUserCookie
} from "../../../../lib/auth-session";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

function apiBase() {
  return (process.env.NVOID_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || "https://edge.jobkar.in").replace(/\/+$/, "");
}
function chatBase() {
  return (process.env.NEXT_PUBLIC_SOCKET_URL || "https://chat.jobkar.in").replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace(/\/+$/, "");
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
async function sendUpstream(url: URL, method: string, requestHeaders: Headers, body: ArrayBuffer | undefined, accessToken: string) {
  const headers = new Headers();
  const contentType = requestHeaders.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", requestHeaders.get("accept") || "application/json");
  headers.set("authorization", "Bearer " + accessToken);
  return fetch(url, {
    method,
    headers,
    body: method === "GET" || method === "HEAD" ? undefined : body,
    cache: "no-store",
    signal: AbortSignal.timeout(30000)
  });
}

async function handle(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path = [] } = await context.params;
  if (!path.length) return NextResponse.json({ error: "An API path is required." }, { status: 400 });
  const isChat = path[0] === "chat";
  const upstreamPath = (isChat ? path.slice(1) : path).join("/");
  if (!upstreamPath) return NextResponse.json({ error: "An API path is required." }, { status: 400 });

  const cookieStore = await cookies();
  let accessToken = cookieStore.get(nvoidSessionCookie)?.value || "";
  const refreshToken = cookieStore.get(nvoidRefreshCookie)?.value || "";
  const rawUser = cookieStore.get(nvoidUserCookie)?.value || "";
  let email = "";
  try {
    const parsed = JSON.parse(rawUser);
    email = String(parsed?.user?.email || "");
  } catch {}
  if (!accessToken) return NextResponse.json({ error: "Your session has expired. Please sign in again." }, { status: 401 });

  const destination = new URL(upstreamPath + request.nextUrl.search, (isChat ? chatBase() : apiBase()) + "/");
  const method = request.method.toUpperCase();
  const body = method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer();
  let upstream = await sendUpstream(destination, method, request.headers, body, accessToken);
  let nextRefreshToken = "";
  let refreshed = false;

  if (upstream.status === 401 && refreshToken && email && !upstreamPath.toLowerCase().includes("refreshtoken")) {
    try {
      const refreshResponse = await fetch(new URL("/backend/auth/refreshToken", apiBase()), {
        method: "POST",
        headers: { accept: "application/json", "content-type": "application/json" },
        body: JSON.stringify({ email, refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(15000)
      });
      const refreshPayload = await refreshResponse.json().catch(() => ({}));
      const nextAccessToken = tokenFrom(refreshPayload);
      if (refreshResponse.ok && nextAccessToken) {
        accessToken = nextAccessToken;
        nextRefreshToken = refreshFrom(refreshPayload) || refreshToken;
        refreshed = true;
        upstream = await sendUpstream(destination, method, request.headers, body, accessToken);
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
  const response = new NextResponse(upstream.status === 204 || upstream.status === 304 ? null : responseBody, { status: upstream.status, headers: responseHeaders });

  if (refreshed) {
    response.cookies.set(nvoidSessionCookie, accessToken, COOKIE_OPTIONS);
    response.cookies.set(nvoidRefreshCookie, nextRefreshToken, COOKIE_OPTIONS);
  } else if (upstream.status === 401) {
    response.cookies.set(nvoidSessionCookie, "", { ...COOKIE_OPTIONS, maxAge: 0 });
    response.cookies.set(nvoidRefreshCookie, "", { ...COOKIE_OPTIONS, maxAge: 0 });
    response.cookies.set(nvoidUserCookie, "", { ...COOKIE_OPTIONS, maxAge: 0 });
  }
  return response;
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;

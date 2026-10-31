import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nvoidSessionCookie, parseAuthenticatedResponse } from "../../../../lib/auth-session";

const allowedActions = new Set(["signin", "register"]);

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  if (!allowedActions.has(action)) return NextResponse.json({ error: "Unsupported authentication action." }, { status: 404 });

  const base = process.env.NVOID_AUTH_BASE_URL?.trim();
  if (!base) {
    return NextResponse.json({ error: "Authentication is not connected. Set NVOID_AUTH_BASE_URL and the matching authentication paths on the web server." }, { status: 503 });
  }

  let upstream: URL;
  try {
    const path = action === "signin"
      ? process.env.NVOID_AUTH_SIGNIN_PATH || "/auth/signin"
      : process.env.NVOID_AUTH_REGISTER_PATH || "/auth/register";
    upstream = new URL(path, base);
    if (upstream.origin !== new URL(base).origin) throw new Error("Authentication path must remain on the configured auth host.");
  } catch {
    return NextResponse.json({ error: "Authentication service URL configuration is invalid." }, { status: 500 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 });
  if (action === "register") {
    const requestedRole = Number((body as Record<string, unknown>).roleId);
    if (requestedRole !== 3 && requestedRole !== 4) {
      return NextResponse.json({ error: "Public registration is available for job seekers and recruiters only." }, { status: 400 });
    }
  }

  try {
    const response = await fetch(upstream, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(15000)
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = typeof payload.error === "string" ? payload.error : typeof payload.message === "string" ? payload.message : "Authentication was rejected.";
      return NextResponse.json({ error }, { status: response.status });
    }

    const authenticated = parseAuthenticatedResponse(payload);
    if (!authenticated) return NextResponse.json({ error: "Authentication response must include an access token and a supported role ID (3, 4 or 7)." }, { status: 502 });

    const cookieStore = await cookies();
    cookieStore.set(nvoidSessionCookie, authenticated.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7
    });

    return NextResponse.json({ authenticated: true, roleId: authenticated.session.roleId, user: authenticated.session.user });
  } catch {
    return NextResponse.json({ error: "Could not reach the configured authentication service." }, { status: 502 });
  }
}

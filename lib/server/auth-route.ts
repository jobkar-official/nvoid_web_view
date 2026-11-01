import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  nvoidRefreshCookie,
  nvoidSessionCookie,
  nvoidUserCookie,
  parseAuthenticatedResponse
} from "../auth-session";

const allowedActions = new Set(["signin", "register", "forgot-password"]);
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

export async function handleAuthRequest(request: NextRequest, action: string) {
  if (!allowedActions.has(action)) {
    return NextResponse.json({ error: "Unsupported authentication action." }, { status: 404 });
  }

  const base = (
    process.env.NVOID_AUTH_BASE_URL ||
    process.env.NVOID_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "https://edge.jobkar.in"
  ).trim();

  let upstream: URL;
  try {
    const path = action === "signin"
      ? "/authentication/authController/login"
      : action === "register"
        ? process.env.NVOID_AUTH_REGISTER_PATH || "/backend/auth/register"
        : process.env.NVOID_AUTH_FORGOT_PASSWORD_PATH || "/backend/auth/OAuthGenPassword";
    upstream = new URL(path, base);
    if (upstream.origin !== new URL(base).origin) throw new Error("Authentication path must remain on the configured auth host.");
  } catch {
    return NextResponse.json({ error: "Authentication service URL configuration is invalid." }, { status: 500 });
  }

  let body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "A valid JSON request body is required." }, { status: 400 });
  }

  if (action === "forgot-password") {
    const email = (body as Record<string, unknown>).email;
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }
    if (upstream.pathname.includes("OAuthGenPassword")) {
      upstream.searchParams.set("email", email.trim());
      body = {};
    } else {
      body = { email: email.trim() };
    }
  } else if (action === "signin") {
    const credentials = body as Record<string, unknown>;
    const email = typeof credentials.email === "string" ? credentials.email.trim() : "";
    const password = typeof credentials.password === "string" ? credentials.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    body = { email, password };
  } else {
    const requestedRole = Number((body as Record<string, unknown>).roleId);
    if (requestedRole !== 3 && requestedRole !== 4) {
      return NextResponse.json({ error: "Public registration is available for job seekers and recruiters only." }, { status: 400 });
    }
    body = { ...(body as Record<string, unknown>), platform: "WEB" };
  }

  try {
    const response = await fetch(upstream, {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(20000)
    });
    const payload = await response.json().catch(() => ({}));

    if (action === "forgot-password") {
      if (!response.ok) {
        return NextResponse.json({ error: "We couldn't process your request right now. Please try again later." }, { status: response.status });
      }
      return NextResponse.json({
        submitted: true,
        message: "If an account matches that email, password reset instructions will be sent."
      });
    }

    if (!response.ok) {
      if (response.status === 404 && action === "signin") {
        return NextResponse.json({
          error: "The local sign-in route reached the configured Jobkar host, but that host returned 404 for /authentication/authController/login. Check the Edge Gateway route mapping.",
          source: "jobkar-auth-upstream",
          upstreamStatus: 404
        }, {
          status: 502,
          headers: { "x-nvoid-auth-route": "/api/auth/signin", "x-nvoid-auth-upstream-status": "404" }
        });
      }
      const error = typeof payload.detail === "string"
        ? payload.detail
        : typeof payload.error === "string"
          ? payload.error
          : typeof payload.message === "string"
            ? payload.message
            : "Authentication was rejected.";
      return NextResponse.json({ error, source: "jobkar-auth-upstream", upstreamStatus: response.status }, {
        status: response.status,
        headers: { "x-nvoid-auth-route": `/api/auth/${action}`, "x-nvoid-auth-upstream-status": String(response.status) }
      });
    }

    const authenticated = parseAuthenticatedResponse(payload);
    if (!authenticated) {
      return NextResponse.json({ error: "Authentication response must include an access token and a supported role ID (3, 4 or 7)." }, { status: 502 });
    }

    const cookieStore = await cookies();
    cookieStore.set(nvoidSessionCookie, authenticated.token, cookieOptions);
    if (authenticated.refreshToken) cookieStore.set(nvoidRefreshCookie, authenticated.refreshToken, cookieOptions);
    else cookieStore.set(nvoidRefreshCookie, "", { ...cookieOptions, maxAge: 0 });
    cookieStore.set(nvoidUserCookie, JSON.stringify({ roleId: authenticated.session.roleId, user: authenticated.session.user }), cookieOptions);

    return NextResponse.json({
      authenticated: true,
      roleId: authenticated.session.roleId,
      user: authenticated.session.user
    }, {
      headers: { "x-nvoid-auth-route": `/api/auth/${action}` }
    });
  } catch {
    return NextResponse.json({ error: "Could not reach the configured authentication service." }, { status: 502 });
  }
}

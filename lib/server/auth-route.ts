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

  const base = (process.env.NVOID_AUTH_BASE_URL || "https://api.nvoidai.com").trim();

  let upstream: URL;
  try {
    const path = action === "signin"
      ? "/authentication/authController/login"
      : action === "register"
        ? process.env.NVOID_AUTH_REGISTER_PATH || "/authentication/authController/register"
        : process.env.NVOID_AUTH_FORGOT_PASSWORD_PATH || "/authentication/authController/sendCodeForgotPassword";
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
    upstream.searchParams.set("email", email.trim());
    body = {};
  } else if (action === "signin") {
    const credentials = body as Record<string, unknown>;
    const email = typeof credentials.email === "string" ? credentials.email.trim() : "";
    const password = typeof credentials.password === "string" ? credentials.password : "";
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    body = { email, password };
  } else {
    const registration = body as Record<string, unknown>;
    const name = typeof registration.name === "string" ? registration.name.trim() : "";
    const email = typeof registration.email === "string" ? registration.email.trim() : "";
    const password = typeof registration.password === "string" ? registration.password : "";
    const roleId = Number(registration.roleId);
    if (!name || !email || !password || (roleId !== 3 && roleId !== 4)) {
      return NextResponse.json({ error: "Name, valid email, password and account type are required." }, { status: 400 });
    }
    body = { ...registration, name, email, roleId, platform: "WEB" };
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

    if (!response.ok) {
      const error = typeof payload.detail === "string"
        ? payload.detail
        : typeof payload.error === "string"
          ? payload.error
          : typeof payload.message === "string"
            ? payload.message
            : "Authentication was rejected.";
      return NextResponse.json({ error, source: "nvoid-auth-upstream", upstreamStatus: response.status }, {
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
    return NextResponse.json({ error: "Could not reach the NvoidAI authentication service." }, { status: 502 });
  }
}

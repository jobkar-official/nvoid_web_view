import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  getNvoidSession,
  nvoidRefreshCookie,
  nvoidSessionCookie,
  nvoidUserCookie,
  parseAuthenticatedResponse
} from "../../../../lib/auth-session";

const accessCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7
};

const refreshCookieOptions = {
  ...accessCookieOptions,
  maxAge: 60 * 60 * 24 * 14
};

export async function GET() {
  const session = await getNvoidSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, ...session }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);
  const authenticated = parseAuthenticatedResponse(payload);

  if (!authenticated) {
    return NextResponse.json({ error: "Jobkar returned an invalid authentication session." }, { status: 502 });
  }

  const cookieStore = await cookies();
  cookieStore.set(nvoidSessionCookie, authenticated.token, accessCookieOptions);
  if (authenticated.refreshToken) {
    cookieStore.set(nvoidRefreshCookie, authenticated.refreshToken, refreshCookieOptions);
  } else {
    cookieStore.set(nvoidRefreshCookie, "", { ...refreshCookieOptions, maxAge: 0 });
  }
  cookieStore.set(
    nvoidUserCookie,
    JSON.stringify({ roleId: authenticated.session.roleId, user: authenticated.session.user }),
    accessCookieOptions
  );

  return NextResponse.json({
    authenticated: true,
    roleId: authenticated.session.roleId,
    user: authenticated.session.user
  }, {
    headers: { "cache-control": "no-store" }
  });
}
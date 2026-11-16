import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { nvoidRefreshCookie, nvoidSessionCookie, nvoidUserCookie } from "../../../../lib/auth-session";

export async function POST() {
  const cookieStore = await cookies();
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0
  };
  cookieStore.set(nvoidSessionCookie, "", options);
  cookieStore.set(nvoidRefreshCookie, "", options);
  cookieStore.set(nvoidUserCookie, "", options);
  return NextResponse.json({ success: true });
}
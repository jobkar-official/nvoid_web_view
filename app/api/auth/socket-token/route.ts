import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getNvoidSession, nvoidSessionCookie } from "../../../../lib/auth-session";

export async function GET() {
  const [session, cookieStore] = await Promise.all([getNvoidSession(), cookies()]);
  const token = cookieStore.get(nvoidSessionCookie)?.value;

  if (!session || !token) {
    return NextResponse.json({ error: "Your session has expired. Please sign in again." }, {
      status: 401,
      headers: { "cache-control": "no-store", "referrer-policy": "no-referrer" }
    });
  }

  return NextResponse.json({ token }, {
    headers: {
      "cache-control": "no-store, private",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff"
    }
  });
}
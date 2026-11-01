import { NextResponse } from "next/server";
import { getNvoidSession } from "../../../../lib/auth-session";

export async function GET() {
  const session = await getNvoidSession();
  if (!session) return NextResponse.json({ authenticated: false }, { status: 401 });
  return NextResponse.json({ authenticated: true, ...session }, { headers: { "cache-control": "no-store" } });
}

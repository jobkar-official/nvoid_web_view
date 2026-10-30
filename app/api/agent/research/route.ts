import { NextRequest } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  return requestAgent("/api/research/tools", { method: "GET" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || typeof body.query !== "string" || body.query.trim().length < 3) {
      return Response.json({ error: "Enter a research question containing at least three characters." }, { status: 400 });
    }
    return requestAgent("/api/research/run", {
      method: "POST",
      body,
      timeoutMs: 330_000,
    });
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}

import { NextRequest } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ error: "A research request is required." }, { status: 400 });
    }
    if (typeof body.query !== "string" || body.query.trim().length < 3) {
      return Response.json({ error: "Enter a research query of at least three characters." }, { status: 400 });
    }
    return requestAgent("/api/research/run", {
      method: "POST",
      body,
      timeoutMs: 360_000
    });
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}

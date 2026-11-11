import { NextRequest } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || !("profile" in body) || typeof body.userId !== "string") {
      return Response.json({ error: "A userId and candidate profile are required." }, { status: 400 });
    }
    return requestAgent("/api/agent/run", { method: "POST", body });
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}

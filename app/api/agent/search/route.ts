import { NextRequest } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || !("profile" in body)) {
      return Response.json({ error: "A candidate profile is required." }, { status: 400 });
    }
    return requestAgent("/api/jobs/search", { method: "POST", body });
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }
}

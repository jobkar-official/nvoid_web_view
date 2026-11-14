import { NextRequest, NextResponse } from "next/server";
import { agentApi } from "@/lib/api/agent.api";

export const dynamic = "force-dynamic";
export const maxDuration = 35;

type SearchBody = { jobtitle?: unknown; location?: unknown };

export async function POST(request: NextRequest) {
  let body: SearchBody;
  try { body = await request.json() as SearchBody; }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  const jobtitle = typeof body.jobtitle === "string" ? body.jobtitle.trim().slice(0, 180) : "";
  const location = typeof body.location === "string" ? body.location.trim().slice(0, 180) : "";
  if (!jobtitle || !location) {
    return NextResponse.json({ error: "Enter both a job title and location." }, { status: 400 });
  }

  try {
    const result = await agentApi.fetchResults(jobtitle, location);
    return NextResponse.json(result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "NVOIDAI could not complete this job search.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

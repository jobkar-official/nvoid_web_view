import { NextRequest } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function GET(request: NextRequest) {
  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams();
  for (const key of ["page", "limit", "q", "skills", "location", "company", "provider", "remote", "sort"]) {
    const value = incoming.get(key);
    if (value !== null && value.trim()) params.set(key, value.trim());
  }
  if (!params.has("page")) params.set("page", "1");
  if (!params.has("limit")) params.set("limit", "24");
  return requestAgent("/v1/index/jobs?" + params.toString(), { method: "GET" });
}

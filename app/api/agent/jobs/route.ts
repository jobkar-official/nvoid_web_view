import { NextRequest } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";

function boundedInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function addText(params: URLSearchParams, source: URLSearchParams, key: string, maximum: number) {
  const value = source.get(key)?.trim();
  if (value) params.set(key, value.slice(0, maximum));
}

export async function GET(request: NextRequest) {
  const incoming = new URL(request.url).searchParams;
  const params = new URLSearchParams({
    page: String(boundedInteger(incoming.get("page"), 1, 1, 100000)),
    limit: String(boundedInteger(incoming.get("limit"), 24, 1, 100)),
    sort: incoming.get("sort") === "title" || incoming.get("sort") === "company" ? incoming.get("sort") as string : "newest"
  });

  addText(params, incoming, "query", 180);
  addText(params, incoming, "location", 120);
  addText(params, incoming, "company", 120);

  const provider = incoming.get("provider")?.trim().toLowerCase();
  if (provider && ["greenhouse", "lever", "ashby", "smartrecruiters", "nvoidai"].includes(provider)) {
    params.set("provider", provider);
  }

  const remote = incoming.get("remote");
  if (remote === "true" || remote === "false") params.set("remote", remote);

  return requestAgent("/jobs?" + params.toString(), {
    method: "GET",
    timeoutMs: 20_000
  });
}

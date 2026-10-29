import { NextResponse } from "next/server";

type AgentRequestOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  authenticated?: boolean;
  timeoutMs?: number;
};

function upstreamUrl(path: string): URL {
  const base = (process.env.NVOID_AGENT_URL || "http://127.0.0.1:3100").trim();
  let parsed: URL;
  try {
    parsed = new URL(base);
  } catch {
    throw new Error("NVOID_AGENT_URL must be an absolute HTTP(S) URL.");
  }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error("NVOID_AGENT_URL must use HTTP(S) and must not contain URL credentials.");
  }
  return new URL(path.startsWith("/") ? path : `/${path}`, parsed.origin);
}

export async function requestAgent(path: string, options: AgentRequestOptions = {}): Promise<NextResponse> {
  const method = options.method ?? "GET";
  const authenticated = options.authenticated ?? true;
  const headers = new Headers({ accept: "application/json" });

  if (authenticated) {
    const key = process.env.NVOID_AGENT_API_KEY;
    if (!key) {
      return NextResponse.json(
        { error: "Agent connection is not configured. Set NVOID_AGENT_API_KEY on the web server to match AGENT_API_KEY on the agent worker." },
        { status: 503 },
      );
    }
    headers.set("x-agent-api-key", key);
  }

  let url: URL;
  try {
    url = upstreamUrl(path);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid agent URL." }, { status: 500 });
  }

  let body: string | undefined;
  if (method === "POST") {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body ?? {});
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(options.timeoutMs ?? (method === "POST" ? 120_000 : 20_000)),
    });
    const raw = await response.text();
    let data: unknown = raw;
    try {
      data = raw ? JSON.parse(raw) : {};
    } catch {
      data = { error: raw || "Agent returned an empty response." };
    }
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the Nvoid Agent. Check that the worker is running and NVOID_AGENT_URL is correct." },
      { status: 502 },
    );
  }
}

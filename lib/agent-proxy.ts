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
  } catch (error) {
    const failure = describeAgentConnectionFailure(error);
    console.error("Nvoid Agent proxy transport failure", { path, method, ...failure });
    return NextResponse.json(
      {
        error: "Could not reach the Nvoid Agent.",
        detail: failure.detail,
        code: failure.code,
        hint: "Verify that the worker is running, that NVOID_AGENT_URL is reachable from the Next.js server/container, and that both services share the required private network."
      },
      { status: 502 },
    );
  }
}

function describeAgentConnectionFailure(error: unknown): { code?: string; detail: string } {
  const outer = error instanceof Error ? error : new Error(String(error));
  const cause = outer.cause && typeof outer.cause === "object" ? outer.cause as { code?: unknown; message?: unknown } : undefined;
  const code = typeof cause?.code === "string" && /^[A-Z0-9_]+$/.test(cause.code) ? cause.code : undefined;
  const message = typeof cause?.message === "string" ? cause.message : outer.message;
  if (outer.name === "TimeoutError" || outer.name === "AbortError" || /timed? out/i.test(message)) {
    return { code: code || "ETIMEDOUT", detail: "The worker connection timed out before it returned a response." };
  }
  if (code === "ECONNREFUSED") {
    return { code, detail: "The connection was refused. Nothing is listening at the configured worker address and port, or the port is not reachable from this web process." };
  }
  if (code === "ENOTFOUND" || code === "EAI_AGAIN") {
    return { code, detail: "The worker hostname could not be resolved from the Next.js server." };
  }
  if (code === "ECONNRESET" || code === "EHOSTUNREACH" || code === "ENETUNREACH") {
    return { code, detail: "The network path to the worker was reset or is unreachable." };
  }
  if (/certificate|tls|ssl/i.test(message)) {
    return { code: code || "TLS_ERROR", detail: "The secure connection to the worker failed certificate or TLS validation." };
  }
  return { ...(code ? { code } : {}), detail: "The Next.js server could not establish an HTTP connection to the worker. Check the server logs for the underlying network error." };
}

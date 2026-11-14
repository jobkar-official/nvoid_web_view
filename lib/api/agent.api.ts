import "server-only";

export interface JobLocation { raw: string; city: string; countryCode: string; }
export interface JobSource { id: string; name: string; type: "board" | "company" | "aggregator" | string; }
export type MatchType = "exact" | "partial" | "nearby" | "none" | string;
export interface JobMatch { title: MatchType; location: MatchType; }
export interface JobPosting {
  id: string; title: string; company: string; location: JobLocation; remote: boolean;
  skills: string[]; summary: string | null; postedAt: string | null; employmentType: string | null;
  salary: string | number | null; source: JobSource; url: string; applyUrl: string;
  firstSeen: string; match: JobMatch;
}
export interface JobSearchQuery {
  title: string; location: string; country: string; skills: string[];
  company: string | null; remote: string;
}
export interface JobSearchResponse {
  query: JobSearchQuery; page: number; limit: number; total: number; totalPages: number;
  hasNext: boolean; hasPrev: boolean;
  meta: {
    tiers: { exact: number; nearby: number };
    relaxed: boolean; indexed: number; notes: string[]; generatedAt: string;
  };
  jobs: JobPosting[];
}

function agentEndpoint(params?: { jobtitle?: string; location?: string; page?: number; size?: number }) {
  const configuredBase = (process.env.NVOID_AGENT_API_URL || "https://agent.nvoidai.com").trim();
  let base: URL;
  try { base = new URL(configuredBase); }
  catch { throw new Error("NVOID_AGENT_API_URL must be a valid absolute URL."); }

  if (!["http:", "https:"].includes(base.protocol) || base.username || base.password) {
    throw new Error("NVOID_AGENT_API_URL must use HTTP(S) without embedded credentials.");
  }

  const url = new URL("/agent/crawl", base.origin);
  if (params?.jobtitle) url.searchParams.set("jobtitle", params.jobtitle);
  if (params?.location) url.searchParams.set("location", params.location);
  if (params?.page !== undefined) url.searchParams.set("page", String(params.page));
  if (params?.size !== undefined) url.searchParams.set("size", String(params.size));
  return url;
}

async function requestAgent<T>(url: URL): Promise<T> {
  const apiKey = process.env.NVOID_AGENT_API_KEY?.trim();
  if (!apiKey) throw new Error("NVOID_AGENT_API_KEY is missing from the server environment.");

  const response = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json", "x-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(30_000)
  });
  const raw = await response.text();
  let payload: unknown;
  try { payload = raw ? JSON.parse(raw) : {}; }
  catch { throw new Error("The NVOIDAI agent API returned an invalid JSON response."); }

  if (!response.ok) {
    const body = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
    throw new Error(typeof body.error === "string" ? body.error
      : typeof body.message === "string" ? body.message
        : "The NVOIDAI agent API request failed.");
  }
  if (!payload || typeof payload !== "object" || !Array.isArray((payload as { jobs?: unknown }).jobs)) {
    throw new Error("The NVOIDAI agent API response did not contain a jobs array.");
  }
  return payload as T;
}

export const agentApi = {
  fetchResults: (jobtitle: string, location: string) =>
    requestAgent<JobSearchResponse>(agentEndpoint({ jobtitle, location, page: 0, size: 1 })),
  allJobCrawl: () => requestAgent<JobSearchResponse>(agentEndpoint())
};

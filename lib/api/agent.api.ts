import "server-only";

export interface JobSalary { min: number | null; max: number | null; currency: string | null; raw: string | null }
export interface JobPosting {
  id: string;
  title: string;
  company: string | null;
  location: { raw: string; city: string | null; countryCode: string | null };
  remote: boolean;
  skills: string[];
  summary: string;
  postedAt: string | null;
  employmentType: string | null;
  salary: JobSalary | null;
  source: { id: string; name: string; type: string };
  url: string;
  applyUrl: string;
  firstSeen: string;
  match?: { title: "exact" | "related"; location: string };
}

export interface JobSearchResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  meta: { tiers: Record<string, number>; relaxed: boolean; indexed: number; notes: string[]; crawlQueued?: boolean; unresolvedSkills?: string[] };
  jobs: JobPosting[];
}

export interface JobSearchParams {
  title?: string;
  location?: string;
  skills?: string;
  company?: string;
  source?: string;
  remote?: "include" | "only" | "exclude";
  posted?: number;
  page?: number;
  limit?: number;
}

export interface IndexSummary { total: number; sources: { id: string; count: number }[]; countries: number }

export class AgentError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "AgentError";
  }
}

const REQUEST_TIMEOUT_MS = 20_000;

async function request<T>(path: string, params: URLSearchParams, revalidate?: number): Promise<T> {
  const apiKey = process.env.NVOID_AGENT_API_KEY?.trim();
  if (!apiKey) throw new AgentError("NVOID_AGENT_API_KEY is not configured.", 500);
  const base = (process.env.NVOID_AGENT_API_URL || "https://agent.nvoidai.com").trim();
  const url = new URL(path, base);
  url.search = params.toString();

  const response = await fetch(url, {
    headers: { accept: "application/json", "x-api-key": apiKey },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    ...(revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } })
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.error?.message ?? payload?.error;
    throw new AgentError(typeof detail === "string" ? detail : "The job service request failed.", response.status);
  }
  return payload as T;
}

async function skillNames(): Promise<Map<string, string>> {
  const { skills } = await request<{ skills: { skill: string; slug: string }[] }>("/agent/skills", new URLSearchParams({ counts: "false" }), 86_400);
  return new Map(skills.map((item) => [item.slug, item.skill]));
}

export const agentApi = {
  async search(input: JobSearchParams): Promise<JobSearchResponse> {
    const params = new URLSearchParams();
    if (input.title) params.set("jobtitle", input.title);
    if (input.location) params.set("location", input.location);
    if (input.skills) params.set("skill", input.skills);
    if (input.company) params.set("company", input.company);
    if (input.source) params.set("source", input.source);
    if (input.remote) params.set("remote", input.remote);
    if (input.posted) params.set("posted", String(input.posted));
    params.set("page", String(input.page ?? 1));
    params.set("limit", String(input.limit ?? 20));

    const [result, names] = await Promise.all([
      request<JobSearchResponse>("/agent/crawl", params),
      skillNames().catch(() => new Map<string, string>())
    ]);
    return { ...result, jobs: result.jobs.map((job) => ({ ...job, skills: job.skills.map((skill) => names.get(skill) ?? skill) })) };
  },

  async summary(): Promise<IndexSummary | null> {
    try {
      const stats = await request<{ total: number; bySource: Record<string, number>; byCountry: Record<string, number> }>("/agent/stats", new URLSearchParams(), 300);
      return {
        total: stats.total,
        sources: Object.entries(stats.bySource).map(([id, count]) => ({ id, count })),
        countries: Object.keys(stats.byCountry).length
      };
    } catch {
      return null;
    }
  }
};

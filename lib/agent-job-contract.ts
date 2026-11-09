import { requestAgent } from "@/lib/agent-proxy";

export type EngineCountry = {
  code: string;
  name: string;
  slug: string;
  aliases?: string[];
};

export type EngineJob = {
  id: string;
  title: string;
  company: string | null;
  location: { raw: string; city: string | null; countryCode: string | null };
  remote: boolean;
  match: { title: "exact" | "related"; location: string };
  score: number;
  summary: string;
  postedAt: string | null;
  employmentType: string | null;
  salary: { min: number | null; max: number | null; currency: string | null; raw: string | null } | null;
  source: { id: string; name: string; type: string };
  url: string;
};

export type EngineJobsPayload = {
  query?: { title?: string; country?: { code: string; name: string } | null; city?: { name: string } | null };
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  jobs: EngineJob[];
  meta?: {
    complete?: boolean;
    cached?: boolean;
    stale?: boolean;
    notes?: string[];
    sources?: Record<string, { status: string; count: number; ms: number; error?: string }>;
  };
};

export type EngineJobsResponse = EngineJobsPayload & { error?: unknown; message?: unknown };

export function engineErrorMessage(payload: EngineJobsResponse, fallback: string): string {
  if (typeof payload.error === "string" && payload.error.trim()) return payload.error;
  if (payload.error && typeof payload.error === "object") {
    const nested = payload.error as { message?: unknown; detail?: unknown };
    if (typeof nested.message === "string" && nested.message.trim()) return nested.message;
    if (typeof nested.detail === "string" && nested.detail.trim()) return nested.detail;
  }
  if (typeof payload.message === "string" && payload.message.trim()) return payload.message;
  return fallback;
}

export async function requestEngineJobs(path: string, refreshAttempts = 10) {
  let response = await requestAgent(path, { method: "GET", timeoutMs: 20000 });
  let payload = await response.json().catch(() => ({})) as EngineJobsResponse;

  for (let attempt = 0; response.ok && attempt < refreshAttempts; attempt++) {
    const hasJobs = Array.isArray(payload.jobs) && payload.jobs.length > 0;
    if (hasJobs || payload.meta?.complete !== false) break;

    await new Promise((resolve) => setTimeout(resolve, 1000));
    response = await requestAgent(path, { method: "GET", timeoutMs: 20000 });
    payload = await response.json().catch(() => ({})) as EngineJobsResponse;
  }

  return { response, payload };
}

let countryCache: { expiresAt: number; countries: EngineCountry[] } | undefined;

export async function resolveEngineLocation(value: string): Promise<{ country?: string; city?: string }> {
  const raw = value.trim();
  if (!raw || /^(worldwide|anywhere|remote|work from anywhere)$/i.test(raw)) return {};

  let countries = countryCache && countryCache.expiresAt > Date.now() ? countryCache.countries : [];
  if (!countries.length) {
    const response = await requestAgent("/v1/catalog/countries", { method: "GET" });
    const payload = await response.json().catch(() => ({})) as { countries?: EngineCountry[] };
    if (!response.ok) throw new Error("The Nvoid Engine country catalogue is unavailable.");
    countries = Array.isArray(payload.countries) ? payload.countries : [];
    countryCache = { expiresAt: Date.now() + 10 * 60_000, countries };
  }

  const normalize = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const parts = raw.split(/[,|]/).map((part) => part.trim()).filter(Boolean);
  const matchesCountry = (part: string) => countries.find((country) =>
    [country.code, country.name, country.slug, ...(country.aliases ?? [])].some((alias) => normalize(alias) === normalize(part))
  );

  const wholeCountry = matchesCountry(raw);
  if (wholeCountry) return { country: wholeCountry.code };

  const trailingCountry = parts.length > 1 ? matchesCountry(parts[parts.length - 1]) : undefined;
  if (trailingCountry) {
    return { country: trailingCountry.code, city: parts[0] };
  }

  return { city: parts[0] || raw };
}

export function toWebJob(job: EngineJob) {
  const salary = job.salary?.raw || (job.salary?.min !== null || job.salary?.max !== null
    ? [job.salary?.currency, job.salary?.min, job.salary?.max].filter((value) => value !== null && value !== undefined).join(" ")
    : "");
  const titleMatch = job.match?.title === "related" ? "Related title" : "Title match";
  const locationMatch = job.match?.location ? job.match.location[0].toUpperCase() + job.match.location.slice(1) + " location" : "Location match";

  return {
    id: job.id,
    title: job.title,
    company: job.company || undefined,
    location: job.location?.raw || (job.remote ? "Remote" : undefined),
    remote: job.remote,
    country: job.location?.countryCode || undefined,
    description: job.summary || undefined,
    url: job.url,
    applyUrl: job.url,
    jobUrl: job.url,
    sourceUrl: job.url,
    applicationUrl: job.url,
    employmentType: job.employmentType || undefined,
    workMode: job.remote ? "Remote" : undefined,
    postedAt: job.postedAt || undefined,
    salary: salary || undefined,
    matchScore: job.score,
    matchReasons: [titleMatch, locationMatch],
    source: job.source?.id || job.source?.name || "public",
    provider: job.source?.id || "public"
  };
}

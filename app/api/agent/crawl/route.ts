import { NextRequest, NextResponse } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;
}

function boundedInteger(value: unknown, fallback: number, minimum: number, maximum: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

function stringValue(value: unknown, maximum = 2000): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maximum) : undefined;
}

function safeUrl(value: unknown): string | undefined {
  const candidate = stringValue(value, 2000);
  if (!candidate) return undefined;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function normalizeJob(value: unknown, index: number): JsonRecord | undefined {
  const job = asRecord(value);
  if (!job) return undefined;
  const title = stringValue(job.title, 240);
  if (!title) return undefined;
  const jobUrl = safeUrl(job.url) || safeUrl(job.jobUrl);
  const applicationUrl = safeUrl(job.applyUrl) || safeUrl(job.applicationUrl);
  const score = typeof job.score === "number" && Number.isFinite(job.score)
    ? Math.max(0, Math.min(100, Math.round(job.score)))
    : typeof job.matchScore === "number" && Number.isFinite(job.matchScore)
      ? Math.max(0, Math.min(100, Math.round(job.matchScore)))
      : undefined;
  return {
    id: stringValue(job.id, 180) || "nvoid-job-" + (index + 1),
    title,
    source: stringValue(job.provider, 100) || stringValue(job.source, 100) || "company-career-page",
    company: stringValue(job.company, 180),
    location: stringValue(job.location, 180),
    country: stringValue(job.country, 100),
    description: stringValue(job.description, 3000),
    salary: stringValue(job.salary, 180),
    jobUrl,
    sourceUrl: jobUrl,
    applicationUrl,
    employmentType: stringValue(job.employmentType, 100),
    workMode: job.remote === true ? "Remote" : undefined,
    postedAt: stringValue(job.postedAt, 100) || stringValue(job.firstSeen, 100),
    experience: stringValue(job.experience, 180),
    noticePeriod: stringValue(job.noticePeriod, 180),
    availabilityStatus: stringValue(job.status, 100),
    isOpen: job.status === "open" || job.isOpen === true,
    matchScore: score,
    matchReasons: Array.isArray(job.matchReasons)
      ? job.matchReasons.filter((reason): reason is string => typeof reason === "string").slice(0, 5)
      : undefined,
    canAutoApply: false
  };
}

export async function POST(request: NextRequest) {
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const body = asRecord(input);
  const profile = asRecord(body?.profile);
  const title = stringValue(profile?.jobTitle, 180);
  const location = stringValue(profile?.location, 180);

  if (!title) {
    return NextResponse.json({ error: "A candidate profile with a job title is required." }, { status: 400 });
  }
  if (!location) {
    return NextResponse.json({ error: "A target city, country or remote location is required." }, { status: 400 });
  }

  const params = new URLSearchParams({
    title,
    city: location,
    page: String(boundedInteger(body?.page, 1, 1, 10000)),
    limit: String(boundedInteger(body?.pageSize ?? body?.limit, 100, 1, 100))
  });
  if (profile?.remote === true || profile?.openToRemote === true) params.set("remote", "true");
  if (typeof profile?.experienceYears === "number" && Number.isFinite(profile.experienceYears)) {
    params.set("experience", String(Math.max(0, Math.min(60, profile.experienceYears))));
  }

  const upstream = await requestAgent("/search?" + params.toString(), {
    method: "GET",
    timeoutMs: 30_000
  });
  const payload: unknown = await upstream.json().catch(() => ({}));
  if (!upstream.ok) return NextResponse.json(payload, { status: upstream.status });

  const result = asRecord(payload);
  if (!result) {
    return NextResponse.json({ error: "The Nvoid Engine returned an invalid search response." }, { status: 502 });
  }

  const sourceJobs = Array.isArray(result.jobs) ? result.jobs : [];
  const jobs = sourceJobs.flatMap((job, index) => {
    const normalized = normalizeJob(job, index);
    return normalized ? [normalized] : [];
  });
  const totalFound = typeof result.total === "number" ? result.total : jobs.length;
  const providerCounts = new Map<string, number>();
  for (const value of sourceJobs) {
    const job = asRecord(value);
    const provider = stringValue(job?.provider, 100) || stringValue(job?.source, 100) || "company-career-page";
    providerCounts.set(provider, (providerCounts.get(provider) ?? 0) + 1);
  }
  const sources = [...providerCounts.entries()].map(([serverId, found]) => ({
    serverId,
    found,
    fetchedCount: found,
    normalizedCount: found,
    roleMatchedCount: found,
    locationMatchedCount: found,
    connectionStatus: "connected"
  }));
  if (!sources.length) {
    sources.push({
      serverId: "nvoid-engine-index",
      found: 0,
      fetchedCount: 0,
      normalizedCount: 0,
      roleMatchedCount: 0,
      locationMatchedCount: 0,
      connectionStatus: "connected"
    });
  }

  const page = typeof result.page === "number" ? result.page : 1;
  const pageSize = typeof result.limit === "number" ? result.limit : jobs.length;
  const report = {
    role: title,
    location,
    depth: "indexed",
    totalFound,
    page,
    pageSize,
    totalPages: pageSize > 0 ? Math.ceil(totalFound / pageSize) : 0,
    hasMore: page * pageSize < totalFound,
    sourceSummary: [...providerCounts.entries()].map(([source, count]) => ({ source, count })),
    note: "Results come from Nvoid Engine's own indexed company career pages. Background crawling refreshes the index; this search reads the current index."
  };

  return NextResponse.json({
    ...result,
    jobs,
    sources,
    report,
    timingsMs: {},
    returnedCount: jobs.length,
    allJobsAvailable: page * pageSize >= totalFound,
    moreResultsAvailable: page * pageSize < totalFound
  }, { status: upstream.status });
}

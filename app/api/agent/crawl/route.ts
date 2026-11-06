import { NextRequest, NextResponse } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";

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
  const matchScore = typeof job.matchScore === "number" && Number.isFinite(job.matchScore)
    ? Math.max(0, Math.min(100, Math.round(job.matchScore)))
    : undefined;
  const postedAt = typeof job.postedAt === "number" || typeof job.postedAt === "string" ? job.postedAt : undefined;
  const matchReasons = Array.isArray(job.matchReasons)
    ? job.matchReasons.filter((reason): reason is string => typeof reason === "string").slice(0, 5).map(reason => reason.slice(0, 240))
    : undefined;
  return {
    id: stringValue(job.id, 180) || `crawl-job-${index + 1}`,
    title,
    source: stringValue(job.source, 100),
    company: stringValue(job.company, 180),
    location: stringValue(job.location, 180),
    country: stringValue(job.country, 100),
    description: stringValue(job.description, 3000),
    salary: stringValue(job.salary, 180),
    jobUrl: safeUrl(job.jobUrl),
    applicationUrl: safeUrl(job.applicationUrl),
    employmentType: stringValue(job.employmentType, 100),
    workMode: stringValue(job.workMode, 100),
    postedAt,
    experience: stringValue(job.experience, 180),
    matchScore,
    matchReasons,
    canAutoApply: job.canAutoApply === true || Boolean(safeUrl(job.applicationUrl))
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
  if (!body || !profile || typeof profile.jobTitle !== "string" || !profile.jobTitle.trim()) {
    return NextResponse.json({ error: "A candidate profile with a job title is required." }, { status: 400 });
  }

  const serverIds = Array.isArray(body.serverIds)
    ? body.serverIds.filter((value): value is string => typeof value === "string" && value.trim()).slice(0, 50)
    : undefined;
  const crawlBody = {
    profile,
    limit: boundedInteger(body.limit, 1000, 1, 1000),
    page: boundedInteger(body.page, 1, 1, 100),
    pageSize: boundedInteger(body.pageSize, 100, 1, 100),
    depth: body.depth === "standard" ? "standard" : "deep",
    syncToBackend: false,
    ...(serverIds?.length ? { serverIds } : {})
  };

  const upstream = await requestAgent("/api/agent/crawl", {
    method: "POST",
    body: crawlBody,
    timeoutMs: 330_000
  });
  const payload: unknown = await upstream.json().catch(() => ({}));
  if (!upstream.ok) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  const result = asRecord(payload);
  if (!result) {
    return NextResponse.json({ error: "The Nvoid Agent returned an invalid crawl response." }, { status: 502 });
  }

  const fullJobs = Array.isArray(result.jobsFull) ? result.jobsFull : undefined;
  const sourceJobs = fullJobs?.length ? fullJobs : Array.isArray(result.jobs) ? result.jobs : [];
  const jobs = sourceJobs.flatMap((job, index) => {
    const normalized = normalizeJob(job, index);
    return normalized ? [normalized] : [];
  });

  return NextResponse.json({
    ...result,
    jobs,
    jobsFull: undefined,
    returnedCount: jobs.length,
    allJobsAvailable: Boolean(fullJobs)
  }, { status: upstream.status });
}

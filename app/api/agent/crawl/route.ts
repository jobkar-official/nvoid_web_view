import { NextRequest, NextResponse } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : undefined;
}

function stringValue(value: unknown, maximum = 2000): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maximum) : undefined;
}

function safeUrl(value: unknown): string | undefined {
  const candidate = stringValue(value, 2000);
  if (!candidate) return undefined;
  try {
    const parsed = new URL(candidate);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : undefined;
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
  const applicationUrl = safeUrl(job.applyUrl) || safeUrl(job.applicationUrl) || jobUrl;
  const score = typeof job.score === "number" && Number.isFinite(job.score)
    ? Math.max(0, Math.min(100, Math.round(job.score)))
    : typeof job.matchScore === "number" && Number.isFinite(job.matchScore)
      ? Math.max(0, Math.min(100, Math.round(job.matchScore)))
      : undefined;
  const status = stringValue(job.status, 100);

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
    availabilityStatus: status || "Live source; verify availability on the original listing",
    isOpen: typeof job.isOpen === "boolean" ? job.isOpen : status === "open" ? true : status === "closed" ? false : undefined,
    matchScore: score,
    matchReasons: Array.isArray(job.matchReasons)
      ? job.matchReasons.filter((reason): reason is string => typeof reason === "string").slice(0, 5)
      : undefined,
    canAutoApply: false
  };
}

function parseEventBlock(block: string): { name: string; data: JsonRecord } | undefined {
  const lines = block.split(/\r?\n/);
  const name = lines.find((line) => line.startsWith("event:"))?.slice(6).trim() || "";
  const data = lines
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");
  if (!data) return undefined;
  try {
    const parsed = asRecord(JSON.parse(data));
    return parsed ? { name: name || stringValue(parsed.type, 40) || "", data: parsed } : undefined;
  } catch {
    return undefined;
  }
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

  const tokenResponse = await requestAgent("/live/token", {
    method: "POST",
    body: {},
    timeoutMs: 10000
  });
  const tokenPayload = asRecord(await tokenResponse.json().catch(() => ({})));
  const token = stringValue(tokenPayload?.token, 2000);
  if (!tokenResponse.ok || !token) {
    return NextResponse.json(tokenPayload ?? { error: "The Nvoid Engine could not issue a live-search token." }, {
      status: tokenResponse.ok ? 502 : tokenResponse.status
    });
  }

  let agentBase: URL;
  try {
    agentBase = new URL((process.env.NVOID_AGENT_URL || "http://127.0.0.1:3100").trim());
    if (!["http:", "https:"].includes(agentBase.protocol) || agentBase.username || agentBase.password) {
      throw new Error("Invalid agent URL.");
    }
  } catch {
    return NextResponse.json({ error: "NVOID_AGENT_URL must be an absolute HTTP(S) URL without embedded credentials." }, { status: 500 });
  }

  const liveUrl = new URL("/live", agentBase.origin);
  liveUrl.searchParams.set("title", title);
  liveUrl.searchParams.set("city", location);
  liveUrl.searchParams.set("pool", "true");
  liveUrl.searchParams.set("token", token);
  const experienceYears = profile?.experienceYears;
  if (typeof experienceYears === "number" && Number.isFinite(experienceYears)) {
    liveUrl.searchParams.set("experience", String(Math.max(0, Math.min(60, experienceYears))));
  }

  let upstream: Response;
  try {
    upstream = await fetch(liveUrl, {
      headers: { accept: "text/event-stream" },
      cache: "no-store",
      signal: AbortSignal.timeout(55000)
    });
  } catch {
    return NextResponse.json({
      error: "Could not connect to Nvoid Engine live search.",
      hint: "Verify NVOID_AGENT_URL, the worker port, and the private network between the web server and the engine."
    }, { status: 502 });
  }

  if (!upstream.ok) {
    const raw = await upstream.text().catch(() => "");
    let payload: unknown = { error: raw || "The Nvoid Engine rejected the live search request." };
    try {
      payload = raw ? JSON.parse(raw) : payload;
    } catch {
      payload = { error: raw || "The Nvoid Engine rejected the live search request." };
    }
    return NextResponse.json(payload, { status: upstream.status });
  }

  if (!upstream.body) {
    return NextResponse.json({ error: "The Nvoid Engine returned an empty live-search stream." }, { status: 502 });
  }

  const jobsById = new Map<string, JsonRecord>();
  const sourceStates = new Map<string, { status: string; count: number; error?: string }>();
  let completed: JsonRecord | undefined;
  let streamError = "";
  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleEvent = (block: string) => {
    const event = parseEventBlock(block);
    if (!event) return;
    const payload = event.data;

    if (event.name === "started") {
      const names = Array.isArray(payload.sources) ? payload.sources : [];
      for (const item of names) {
        const source = stringValue(item, 100);
        if (source && !sourceStates.has(source)) sourceStates.set(source, { status: "running", count: 0 });
      }
      return;
    }

    if (event.name === "jobs") {
      const source = stringValue(payload.source, 100) || "unknown";
      const rows = Array.isArray(payload.jobs) ? payload.jobs : [];
      for (const value of rows) {
        const job = asRecord(value);
        if (!job) continue;
        const id = stringValue(job.id, 180) || safeUrl(job.url) || title + ":" + String(jobsById.size);
        jobsById.set(id, job);
      }
      const state = sourceStates.get(source) ?? { status: "running", count: 0 };
      state.count = Math.max(state.count, rows.length);
      sourceStates.set(source, state);
      return;
    }

    if (event.name === "source") {
      const source = stringValue(payload.source, 100);
      if (!source) return;
      sourceStates.set(source, {
        status: stringValue(payload.status, 40) || "error",
        count: typeof payload.count === "number" ? payload.count : sourceStates.get(source)?.count ?? 0,
        error: stringValue(payload.error, 240)
      });
      return;
    }

    if (event.name === "done") {
      completed = payload;
      return;
    }

    if (event.name === "error") {
      streamError = stringValue(payload.error, 500) || "The live-search stream reported an error.";
    }
  };

  try {
    while (true) {
      const chunk = await reader.read();
      buffer += decoder.decode(chunk.value, { stream: !chunk.done }).replace(/\r\n/g, "\n");
      let boundary = buffer.indexOf("\n\n");
      while (boundary >= 0) {
        handleEvent(buffer.slice(0, boundary));
        buffer = buffer.slice(boundary + 2);
        boundary = buffer.indexOf("\n\n");
      }
      if (chunk.done) break;
    }
    if (buffer.trim()) handleEvent(buffer);
  } catch {
    await reader.cancel().catch(() => undefined);
    return NextResponse.json({ error: "The Nvoid Engine live-search stream ended unexpectedly." }, { status: 502 });
  }

  if (!completed && !streamError) {
    return NextResponse.json({ error: "The Nvoid Engine ended the live-search stream before sending its completion event." }, { status: 502 });
  }

  const rawJobs = [...jobsById.values()].slice(0, 1000);
  const jobs = rawJobs.flatMap((job, index) => {
    const normalized = normalizeJob(job, index);
    return normalized ? [normalized] : [];
  });

  const sourceCounts = new Map<string, number>();
  for (const job of jobs) {
    const source = stringValue(job.source, 100) || "company-career-page";
    sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  }

  if (sourceStates.size === 0) {
    for (const [source, count] of sourceCounts) sourceStates.set(source, { status: "ok", count });
  }

  const sources = [...sourceStates.entries()].map(([serverId, state]) => {
    const status = state.status === "ok" ? "connected" : state.status === "timeout" ? "timeout" : state.status === "error" ? "error" : "running";
    return {
      serverId,
      found: state.count,
      fetchedCount: state.count,
      normalizedCount: sourceCounts.get(serverId) ?? state.count,
      roleMatchedCount: sourceCounts.get(serverId) ?? state.count,
      locationMatchedCount: sourceCounts.get(serverId) ?? state.count,
      connectionStatus: status,
      error: state.error
    };
  });

  const totalFound = typeof completed?.total === "number" ? completed.total : jobs.length;
  const elapsed = typeof completed?.ms === "number" ? completed.ms : undefined;
  const report = {
    role: title,
    location,
    depth: "indexed",
    totalFound,
    page: 1,
    pageSize: jobs.length,
    totalPages: 1,
    hasMore: false,
    sourceSummary: [...sourceCounts.entries()].map(([source, count]) => ({ source, count })),
    note: "Results combine Nvoid's stored company-career index with live public job feeds. Availability and application details should be confirmed on each original listing."
  };

  if (streamError) report.note += " Partial stream warning: " + streamError;

  return NextResponse.json({
    jobs,
    sources,
    report,
    timingsMs: elapsed === undefined ? {} : { sourceSearch: elapsed, discovery: elapsed, total: elapsed },
    returnedCount: jobs.length,
    allJobsAvailable: true,
    moreResultsAvailable: false,
    warning: streamError || undefined
  });
}

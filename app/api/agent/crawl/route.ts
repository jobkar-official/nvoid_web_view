import { NextRequest, NextResponse } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";
import { engineErrorMessage, requestEngineJobs, resolveEngineLocation, type EngineJobsPayload, toWebJob } from "@/lib/agent-job-contract";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type RequestBody = {
  profile?: {
    jobTitle?: unknown;
    location?: unknown;
  };
  limit?: unknown;
};

function textValue(value: unknown, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json() as RequestBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const title = textValue(body.profile?.jobTitle, 180);
  const location = textValue(body.profile?.location, 180);

  if (!title) return NextResponse.json({ error: "Enter a job title or skill to search." }, { status: 400 });
  if (!location) return NextResponse.json({ error: "Enter a city, country or remote location to search." }, { status: 400 });

  const startedAt = Date.now();

  try {
    const place = await resolveEngineLocation(location);
    const buildPath = (page: number) => {
      const params = new URLSearchParams({
        title,
        page: String(page),
        limit: "50",
        remote: "true",
        sort: "relevance"
      });
      if (place.country) params.set("country", place.country);
      if (place.city) params.set("city", place.city);
      return "/v1/jobs?" + params.toString();
    };

    const { response: firstResponse, payload: firstPayload } = await requestEngineJobs(buildPath(1));
    if (!firstResponse.ok) {
      const message = engineErrorMessage(firstPayload, "Nvoid Engine could not complete this search.");
      return NextResponse.json({ error: message, meta: firstPayload.meta }, { status: firstResponse.status });
    }

    const requestedLimit = typeof body.limit === "number" && Number.isFinite(body.limit)
      ? Math.max(1, Math.min(300, Math.floor(body.limit)))
      : 300;
    const availablePages = Math.min(6, Math.max(1, firstPayload.totalPages || 1));
    const requestedPages = Math.min(availablePages, Math.ceil(requestedLimit / 50));
    const remaining = await Promise.all(Array.from({ length: requestedPages - 1 }, async (_, index) => {
      const response = await requestAgent(buildPath(index + 2), { method: "GET", timeoutMs: 20000 });
      if (!response.ok) return [];
      const payload = await response.json().catch(() => ({})) as EngineJobsPayload;
      return Array.isArray(payload.jobs) ? payload.jobs : [];
    }));

    const rawJobs = [
      ...(Array.isArray(firstPayload.jobs) ? firstPayload.jobs : []),
      ...remaining.flat()
    ];
    const uniqueJobs = [...new Map(rawJobs.map((job) => [job.id || job.url, job])).values()];
    const jobs = uniqueJobs.slice(0, requestedLimit).map(toWebJob);
    const sourceStatus = firstPayload.meta?.sources ?? {};
    const sources = Object.entries(sourceStatus).map(([serverId, source]) => {
      const sourceJobs = uniqueJobs.filter((job) => job.source?.id === serverId);
      const status = source.status === "ok" ? "connected" : source.status === "pending" ? "running" : source.status;
      return {
        serverId,
        tool: serverId,
        found: source.count,
        fetchedCount: source.count,
        normalizedCount: sourceJobs.length,
        roleMatchedCount: sourceJobs.length,
        locationMatchedCount: sourceJobs.filter((job) => job.match?.location === "exact" || job.match?.location === "nearby").length,
        connectionStatus: status,
        error: source.error
      };
    });

    const report = {
      role: title,
      location,
      depth: "indexed" as const,
      totalFound: firstPayload.total ?? jobs.length,
      page: 1,
      pageSize: jobs.length,
      totalPages: firstPayload.totalPages ?? 1,
      hasMore: (firstPayload.total ?? jobs.length) > jobs.length,
      sourceSummary: Object.entries(sourceStatus).map(([source, value]) => ({ source, count: value.count })),
      searchPagesFetched: Object.keys(sourceStatus).length,
      crawlPagesAttempted: 0,
      crawlPagesMatched: jobs.length,
      note: [
        ...(firstPayload.meta?.notes ?? []),
        firstPayload.meta?.complete === false ? "Some public sources are still completing in the engine cache; repeat the search to retrieve refreshed results." : ""
      ].filter(Boolean).join(" ")
    };

    const elapsed = Date.now() - startedAt;
    return NextResponse.json({
      jobs,
      sources,
      report,
      timingsMs: { sourceSearch: elapsed, discovery: elapsed, total: elapsed },
      returnedCount: jobs.length,
      allJobsAvailable: jobs.length >= (firstPayload.total ?? jobs.length),
      moreResultsAvailable: report.hasMore,
      engine: {
        complete: firstPayload.meta?.complete ?? false,
        cached: firstPayload.meta?.cached ?? false,
        stale: firstPayload.meta?.stale ?? false
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Nvoid Engine search failed."
    }, { status: 502 });
  }
}

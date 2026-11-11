import { NextRequest, NextResponse } from "next/server";
import { requestAgent } from "@/lib/agent-proxy";
import { engineErrorMessage, requestEngineJobs, resolveEngineLocation, type EngineJobsPayload, toWebJob } from "@/lib/agent-job-contract";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function boundedInteger(value: string | null, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.min(maximum, Math.max(minimum, parsed));
}

export async function GET(request: NextRequest) {
  const incoming = new URL(request.url).searchParams;
  const title = incoming.get("query")?.trim().slice(0, 180) || "";
  const location = incoming.get("location")?.trim().slice(0, 180) || "";
  const page = boundedInteger(incoming.get("page"), 1, 1, 10000);
  const limit = boundedInteger(incoming.get("limit"), 24, 1, 50);
  const sort = incoming.get("sort") || "newest";
  const companyFilter = incoming.get("company")?.trim().toLocaleLowerCase() || "";
  const providerFilter = incoming.get("provider")?.trim().toLocaleLowerCase() || "";
  const remoteFilter = incoming.get("remote") || "";

  if (!title || !location) {
    return NextResponse.json({ error: "Enter a job title and location to search Nvoid's job index." }, { status: 400 });
  }

  try {
    const place = await resolveEngineLocation(location);
    const includeRemote = remoteFilter !== "false";
    const buildPath = (targetPage: number) => {
      const params = new URLSearchParams({
        title,
        page: String(targetPage),
        limit: "50",
        remote: String(includeRemote),
        sort: sort === "newest" ? "date" : "relevance"
      });
      if (place.country) params.set("country", place.country);
      if (place.city) params.set("city", place.city);
      return "/v1/jobs?" + params.toString();
    };

    const { response: firstResponse, payload: firstPayload } = await requestEngineJobs(buildPath(1));
    if (!firstResponse.ok) {
      const message = engineErrorMessage(firstPayload, "Nvoid Engine could not search jobs.");
      return NextResponse.json({ error: message, meta: firstPayload.meta }, { status: firstResponse.status });
    }

    const pageCount = Math.min(6, Math.max(1, firstPayload.totalPages || 1));
    const remaining = await Promise.all(Array.from({ length: pageCount - 1 }, async (_, index) => {
      const response = await requestAgent(buildPath(index + 2), { method: "GET", timeoutMs: 20000 });
      if (!response.ok) return [];
      const payload = await response.json().catch(() => ({})) as EngineJobsPayload;
      return Array.isArray(payload.jobs) ? payload.jobs : [];
    }));

    const allJobs = [
      ...(Array.isArray(firstPayload.jobs) ? firstPayload.jobs : []),
      ...remaining.flat()
    ];
    const uniqueJobs = [...new Map(allJobs.map((job) => [job.id || job.url, job])).values()];
    let filtered = uniqueJobs.map(toWebJob);

    if (companyFilter) {
      filtered = filtered.filter((job) => String(job.company || "").toLocaleLowerCase().includes(companyFilter));
    }
    if (providerFilter) {
      filtered = filtered.filter((job) => String(job.source || "").toLocaleLowerCase() === providerFilter);
    }
    if (remoteFilter === "true") {
      filtered = filtered.filter((job) => job.workMode === "Remote");
    }

    if (sort === "company") {
      filtered.sort((left, right) => String(left.company || "").localeCompare(String(right.company || "")));
    } else if (sort === "title") {
      filtered.sort((left, right) => String(left.title).localeCompare(String(right.title)));
    } else {
      filtered.sort((left, right) => Date.parse(String(right.postedAt || "")) - Date.parse(String(left.postedAt || "")) || (Number(right.matchScore) - Number(left.matchScore)));
    }

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const jobs = filtered.slice((page - 1) * limit, page * limit);

    return NextResponse.json({
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      jobs,
      engine: {
        complete: firstPayload.meta?.complete ?? false,
        cached: firstPayload.meta?.cached ?? false,
        stale: firstPayload.meta?.stale ?? false,
        notes: firstPayload.meta?.notes ?? [],
        sources: firstPayload.meta?.sources ?? {}
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "The Nvoid Engine job search failed."
    }, { status: 502 });
  }
}

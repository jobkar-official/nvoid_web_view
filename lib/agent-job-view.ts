import type { GuestSearchJob } from "../components/guest-shell";

export type AgentJobRecord = {
  id?: string; title?: string | null; company?: string | null;
  location?: { raw?: string | null; city?: string | null; countryCode?: string | null } | null;
  remote?: boolean; skills?: string[] | null; summary?: string | null; postedAt?: string | null;
  employmentType?: string | null; salary?: string | number | null;
  source?: { id?: string | null; name?: string | null } | null;
  url?: string | null; applyUrl?: string | null; firstSeen?: string | null;
  match?: { title?: string | null; location?: string | null } | null;
};

function matchLabel(value: string | null | undefined, subject: "title" | "location") {
  if (!value || value === "none") return "";
  const normalized = value.toLowerCase();
  if (normalized === "exact") return "Exact " + subject + " match";
  if (normalized === "nearby") return "Nearby location match";
  if (normalized === "partial") return "Partial " + subject + " match";
  if (normalized === "related") return "Related title match";
  return value.charAt(0).toUpperCase() + value.slice(1) + " " + subject + " match";
}

export function toGuestSearchJob(job: AgentJobRecord): GuestSearchJob {
  const location = job.location?.raw
    || [job.location?.city, job.location?.countryCode].filter(Boolean).join(", ")
    || (job.remote ? "Remote" : "");
  const matchReasons = [
    matchLabel(job.match?.title, "title"),
    matchLabel(job.match?.location, "location")
  ].filter(Boolean);

  return {
    id: job.id || job.url || job.title || "agent-job",
    title: job.title || "Untitled opportunity",
    company: job.company || undefined,
    location: location || undefined,
    country: job.location?.countryCode || undefined,
    description: job.summary || undefined,
    jobUrl: job.url || undefined,
    sourceUrl: job.url || undefined,
    applicationUrl: job.applyUrl || job.url || undefined,
    employmentType: job.employmentType || undefined,
    workMode: job.remote ? "Remote" : undefined,
    postedAt: job.postedAt || undefined,
    firstSeen: job.firstSeen || undefined,
    skills: Array.isArray(job.skills) ? job.skills.filter((skill): skill is string => typeof skill === "string" && Boolean(skill.trim())) : undefined,
    salary: job.salary === null || job.salary === undefined ? undefined : String(job.salary),
    matchReasons: matchReasons.length ? matchReasons : undefined,
    source: job.source?.id || job.source?.name || undefined
  };
}

export function toGuestSearchJobs(jobs: AgentJobRecord[]): GuestSearchJob[] {
  return jobs.map(toGuestSearchJob);
}

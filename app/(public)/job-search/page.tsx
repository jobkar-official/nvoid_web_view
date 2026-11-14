import type { Metadata } from "next";
import GuestHome from "../../../components/guest-home";
import { agentApi, type JobPosting } from "../../../lib/api/agent.api";
import type { GuestSearchJob } from "../../../components/guest-shell";

export const metadata: Metadata = {
  title: "Find Jobs Across Connected Sources",
  description: "Search opportunities across the job sources configured for Nvoid.",
  robots: { index: false, follow: true }
};

type SearchParams = {
  role?: string | string[];
  location?: string | string[];
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function mapJobPostings(jobs: JobPosting[]): GuestSearchJob[] {
  return jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company,
    location: job.location?.raw || job.location?.city,
    country: job.location?.countryCode,
    description: job.summary || undefined,
    jobUrl: job.url,
    applicationUrl: job.applyUrl,
    employmentType: job.employmentType || undefined,
    postedAt: job.postedAt || undefined,
    firstSeen: job.firstSeen,
    skills: job.skills,
    salary: job.salary !== null && job.salary !== undefined ? String(job.salary) : undefined,
    source: job.source?.name,
    matchScore: job.match?.title === "exact" ? 100 : 80
  }));
}

export default async function JobSearchPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialJobTitle = firstValue(params.role).trim();
  const initialLocation = firstValue(params.location).trim() || "Bengaluru, India";

  let initialJobs: GuestSearchJob[] = [];
  let initialTotal = 0;
  let initialError = "";

  if (initialJobTitle) {
    try {
      const response = await agentApi.fetchResults(initialJobTitle, initialLocation);
      const rawJobs = Array.isArray(response?.jobs) ? response.jobs : [];
      initialJobs = mapJobPostings(rawJobs);
      initialTotal = typeof response?.total === "number" ? response.total : initialJobs.length;
    } catch (error) {
      initialJobs = [];
      initialError = error instanceof Error ? error.message : "NVOIDAI could not load job results.";
    }
  }

  return (
    <GuestHome
      initialJobTitle={initialJobTitle}
      initialLocation={initialLocation}
      autoSearch={Boolean(initialJobTitle)}
      initialJobs={initialJobs}
      initialTotal={initialTotal}
      initialError={initialError}
    />
  );
}
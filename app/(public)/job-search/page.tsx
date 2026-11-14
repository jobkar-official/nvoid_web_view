import type { Metadata } from "next";
import GuestHome from "../../../components/guest-home";
import { agentApi } from "../../../lib/api/agent.api";
import { toGuestSearchJobs } from "../../../lib/agent-job-view";

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

export default async function JobSearchPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const initialJobTitle = firstValue(params.role).trim();
  const initialLocation = firstValue(params.location).trim() || "Worldwide";

  let initialJobs: Awaited<ReturnType<typeof toGuestSearchJobs>> | undefined;
  let initialTotal: number | undefined;
  let initialError: string | undefined;

  if (initialJobTitle) {
    try {
      const response = await agentApi.fetchResults(initialJobTitle, initialLocation);
      initialJobs = toGuestSearchJobs(response.jobs || []);
      initialTotal = typeof response.total === "number" ? response.total : initialJobs.length;
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

import type { Metadata } from "next";
import GuestHome from "../../../components/guest-home";
import { agentApi, type JobPosting } from "../../../lib/api/agent.api";

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

  try {
    const response = await agentApi.fetchResults(initialJobTitle, initialLocation);
    const results: JobPosting[] = response?.jobs || [];
    console.log("Fetched job results count:", results.length);
  } catch (error) {
    console.error("Error fetching job results:", error);
  }

  return (
    <GuestHome
      initialJobTitle={initialJobTitle}
      initialLocation={initialLocation}
      autoSearch={Boolean(initialJobTitle)}
    />
  );
}
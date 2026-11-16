import type { Metadata } from "next";
import JobResults from "../../../components/jobs/job-results";
import styles from "../../../components/jobs/jobs.module.css";
import RecordSearch from "../../../components/jobs/record-search";
import SearchBar from "../../../components/jobs/search-bar";
import { agentApi, type JobSearchResponse } from "../../../lib/api/agent.api";
import { readFilters, toParams, type SearchParamsInput } from "../../../lib/jobs/filters";

export const metadata: Metadata = {
  title: "Find Jobs",
  description: "Search open jobs by title and location across company career pages and public job boards.",
  robots: { index: false, follow: true }
};

export default async function JobSearchPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const filters = readFilters(await searchParams, "role");

  let response: JobSearchResponse | null = null;
  try {
    response = await agentApi.search({ title: filters.q, location: filters.location, page: filters.page });
  } catch (error) {
    console.error("Job search failed:", error);
  }

  const heading = filters.q ? `${filters.q} jobs${filters.location ? ` in ${filters.location}` : ""}` : filters.location ? `Jobs in ${filters.location}` : "Find jobs";

  return (
    <div className={styles.board}>
      <header className={styles.header}>
        <span className={styles.eyebrow}>Job search</span>
        <h1 className={styles.title}>{heading}</h1>
        <p className={styles.lead}>Open roles collected from company career pages and public job boards. Apply on the original listing.</p>
      </header>

      <SearchBar role={filters.q} location={filters.location} />

      <JobResults response={response} path="/job-search" params={toParams(filters, "role")} resetHref="/job-search" />

      {response && filters.page === 1 && (filters.q || filters.location) && (
        <RecordSearch jobTitle={filters.q} location={filters.location} resultCount={response.total} />
      )}
    </div>
  );
}

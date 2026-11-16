import type { Metadata } from "next";
import JobResults from "../../../components/jobs/job-results";
import JobsFilters from "../../../components/jobs/jobs-filters";
import styles from "../../../components/jobs/jobs.module.css";
import { agentApi, type JobSearchResponse } from "../../../lib/api/agent.api";
import { readFilters, toParams, type SearchParamsInput } from "../../../lib/jobs/filters";
import { countLabel } from "../../../lib/jobs/format";

export const metadata: Metadata = {
  title: "My Jobs | NVOIDAI",
  description: "Browse open jobs collected from company career pages and public job boards, and filter by skill, location and company.",
  robots: { index: false, follow: true }
};

export default async function JobsPage({ searchParams }: { searchParams: Promise<SearchParamsInput> }) {
  const filters = readFilters(await searchParams);

  const [response, summary] = await Promise.all([
    agentApi
      .search({
        title: filters.q,
        location: filters.location,
        skills: filters.skills,
        company: filters.company,
        source: filters.source,
        remote: filters.remote || undefined,
        posted: filters.posted ? Number(filters.posted) : undefined,
        page: filters.page
      })
      .catch((error: unknown): JobSearchResponse | null => {
        console.error("Jobs listing failed:", error);
        return null;
      }),
    agentApi.summary()
  ]);

  return (
    <div className={styles.board}>
      <section className={styles.hero} aria-labelledby="jobs-title">
        <div className={styles.header}>
          <span className={styles.eyebrow}>Job index</span>
          <h1 id="jobs-title" className={styles.title}>Find work that moves you forward</h1>
          <p className={styles.lead}>Browse open roles collected from company career pages and public job boards. Filter by skill, location and company, then apply on the original listing.</p>
        </div>
        {summary && (
          <div className={styles.metrics}>
            <div className={styles.metric}><strong>{countLabel(summary.total)}</strong><span>Open jobs</span></div>
            <div className={styles.metric}><strong>{countLabel(summary.countries)}</strong><span>Countries</span></div>
            <div className={styles.metric}><strong>{countLabel(summary.sources.length)}</strong><span>Sources</span></div>
          </div>
        )}
      </section>

      <div className={styles.layout}>
        <JobsFilters filters={filters} summary={summary} />
        <section className={styles.header} aria-label="Search results">
          <JobResults response={response} path="/jobs" params={toParams(filters)} resetHref="/jobs" />
        </section>
      </div>
    </div>
  );
}

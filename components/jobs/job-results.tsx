import { Info, SearchX, TriangleAlert } from "lucide-react";
import Link from "next/link";
import type { JobSearchResponse } from "../../lib/api/agent.api";
import { pageHref } from "../../lib/jobs/filters";
import { countLabel } from "../../lib/jobs/format";
import JobCard from "./job-card";
import styles from "./jobs.module.css";
import Pagination from "./pagination";

interface JobResultsProps {
  response: JobSearchResponse | null;
  path: string;
  params: Record<string, string>;
  resetHref: string;
}

function notesFor(response: JobSearchResponse) {
  const { meta } = response;
  const notes: string[] = [];
  if (meta.relaxed) notes.push("No listing matched every word of your search, so these roles match its main keywords.");
  if (meta.unresolvedSkills?.length) notes.push(`Skill not recognised and ignored: ${meta.unresolvedSkills.join(", ")}.`);
  if (meta.tiers.nearby) notes.push(`Includes ${countLabel(meta.tiers.nearby)} ${meta.tiers.nearby === 1 ? "job" : "jobs"} in nearby cities.`);
  return notes;
}

export default function JobResults({ response, path, params, resetHref }: JobResultsProps) {
  if (!response) {
    return (
      <div className={styles.empty} role="alert">
        <span className={styles.emptyIcon}><TriangleAlert size={22} aria-hidden /></span>
        <h3>Job search is temporarily unavailable</h3>
        <p>We could not load jobs right now. Please try again in a moment.</p>
        <Link href={pageHref(path, params, 1)} className={styles.ghost}>Try again</Link>
      </div>
    );
  }

  if (response.total === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}><SearchX size={22} aria-hidden /></span>
        <h3>No jobs found</h3>
        <p>
          {response.meta.crawlQueued
            ? "We have started collecting jobs for this search. Check back in a few minutes."
            : "Try a broader job title, fewer filters or a different location."}
        </p>
        <Link href={resetHref} className={styles.ghost}>Clear search</Link>
      </div>
    );
  }

  const notes = notesFor(response);
  const first = (response.page - 1) * response.limit + 1;

  return (
    <>
      <div className={styles.summaryBar}>
        <h2 className={styles.summaryTitle}>
          <strong>{countLabel(response.total)}</strong> {response.total === 1 ? "job" : "jobs"} found
        </h2>
        <span className={styles.summaryMeta}>
          Showing {countLabel(first)}–{countLabel(first + response.jobs.length - 1)}
        </span>
      </div>

      {notes.length > 0 && (
        <div className={styles.notes}>
          {notes.map((note) => <p key={note} className={styles.note}><Info size={15} aria-hidden />{note}</p>)}
        </div>
      )}

      <div className={styles.grid}>
        {response.jobs.map((job) => <JobCard key={job.id} job={job} />)}
      </div>

      <Pagination path={path} params={params} page={response.page} totalPages={response.totalPages} />
    </>
  );
}

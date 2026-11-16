import { Briefcase, Clock3, Globe, MapPin, Wallet } from "lucide-react";
import type { JobPosting } from "../../lib/api/agent.api";
import { formatSalary, postedLabel, sourceLabel, usefulSummary } from "../../lib/jobs/format";
import ApplyButton from "./apply-button";
import styles from "./jobs.module.css";

const VISIBLE_SKILLS = 5;

export default function JobCard({ job }: { job: JobPosting }) {
  const company = job.company ?? "Company not listed";
  const salary = formatSalary(job.salary);
  const summary = usefulSummary(job);
  const hiddenSkills = job.skills.length - VISIBLE_SKILLS;

  return (
    <article className={styles.card}>
      <header className={styles.cardTop}>
        <span className={styles.mark} aria-hidden>{company.charAt(0).toUpperCase()}</span>
        <div className={styles.company}>
          <strong>{company}</strong>
          <span>{sourceLabel(job.source.id)}</span>
        </div>
        <div className={styles.tags}>
          {job.match?.location === "nearby" && <span className={styles.tag}>Nearby</span>}
          {job.remote && <span className={styles.tag}>Remote</span>}
        </div>
      </header>

      <h3 className={styles.cardTitle}>{job.title}</h3>

      <ul className={styles.meta}>
        {job.location.raw && <li><MapPin size={14} aria-hidden />{job.location.raw}</li>}
        {job.remote && !job.location.raw && <li><Globe size={14} aria-hidden />Remote</li>}
        {job.employmentType && <li><Briefcase size={14} aria-hidden />{job.employmentType}</li>}
        {salary && <li><Wallet size={14} aria-hidden />{salary}</li>}
      </ul>

      {summary && <p className={styles.summary}>{summary}</p>}

      {job.skills.length > 0 && (
        <ul className={styles.skills} aria-label="Skills">
          {job.skills.slice(0, VISIBLE_SKILLS).map((skill) => <li key={skill}>{skill}</li>)}
          {hiddenSkills > 0 && <li>+{hiddenSkills}</li>}
        </ul>
      )}

      <footer className={styles.cardFooter}>
        <span className={styles.posted}><Clock3 size={14} aria-hidden />{postedLabel(job)}</span>
        <ApplyButton url={job.applyUrl || job.url} source={job.source.id} />
      </footer>
    </article>
  );
}

import { ArrowRight, BriefcaseBusiness, Globe2, Rainbow, Search } from "lucide-react";
import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { agentApi } from "../lib/api/agent.api";
import { countLabel } from "../lib/jobs/format";
import styles from "./worker-homepage.module.css";

const POPULAR_SEARCHES = [
  { role: "Software Engineer", location: "Bengaluru" },
  { role: "Java Developer", location: "Noida" },
  { role: "Data Engineer", location: "Hyderabad" },
  { role: "Product Manager", location: "Remote" },
  { role: "Flutter Developer", location: "Pune" }
];

export default async function WorkerHomepage() {
  const summary = await agentApi.summary();

  return (
    <div className="worker-homepage worker-homepage-v2 nvoid-homepage-restored">
      <section className="worker-home-brand-intro" aria-label="NvoidAI job agent">
        <div className="worker-home-intro-copy">
          <span className="worker-home-agent-label"><span className="worker-home-agent-dot" />YOUR AI JOB AGENT</span>
          <h1>
            <span className="worker-home-heading">
              <Image src="/logo.png" alt="" width={64} height={64} priority style={{ filter: "brightness(0) invert(1)" }} />
              <span className="worker-home-heading-copy">NvoidAI : Your Future Career Agent</span>
            </span>
          </h1>
          <p>NvoidAI is your AI job agent. Enter a role and location to search company career pages and public job boards for relevant openings in one place.</p>
        </div>
      </section>

      <section className="worker-home-search-section worker-home-search-v2" aria-label="Search jobs by role and location">
        <Form className="worker-home-search-card" action="/job-search">
          <label className="worker-home-field" htmlFor="home-role">
            <span>JOB TITLE OR SKILL</span>
            <span className="worker-home-field-control"><BriefcaseBusiness size={20} /><input id="home-role" name="role" placeholder="e.g. Product Designer or Java Developer" maxLength={120} autoComplete="off" required /></span>
          </label>
          <span className="worker-home-field-divider" aria-hidden="true" />
          <label className="worker-home-field" htmlFor="home-location">
            <span>PREFERRED LOCATION</span>
            <span className="worker-home-field-control"><Globe2 size={19} /><input id="home-location" name="location" placeholder="City, country or remote" maxLength={120} autoComplete="off" /></span>
          </label>
          <button type="submit" className="worker-home-search-button"><Search size={17} />Find jobs<ArrowRight size={16} /></button>
        </Form>

        <div className="worker-home-search-meta nvoid-home-search-meta">
          <div className="worker-home-search-footnote">
            <Search size={14} />
            {summary ? `${countLabel(summary.total)} open jobs from ${summary.sources.length} sources in ${summary.countries} countries.` : "One search across company career pages and public job boards."}
          </div>
          <div className="worker-home-search-footnote"><Rainbow size={14} />Powered by Alpha - K1.</div>
        </div>

        <nav className={styles.suggestions} aria-label="Popular searches">
          <span className={styles.suggestionsLabel}>Popular:</span>
          {POPULAR_SEARCHES.map(({ role, location }) => (
            <Link key={role} className={styles.chip} href={`/job-search?${new URLSearchParams({ role, location })}`}>
              {role} · {location}
            </Link>
          ))}
        </nav>
      </section>
    </div>
  );
}

"use client";

import Image from "next/image";
import { ArrowRight, BriefcaseBusiness, Globe2, Rainbow, Search } from "lucide-react";

export default function WorkerHomepage() {
  return (
    <div className="worker-homepage worker-homepage-v2 nvoid-homepage-restored">
      <section className="worker-home-brand-intro" aria-label="Nvoid">
        <div className="worker-home-intro-copy">
          <span className="worker-home-agent-label"><span className="worker-home-agent-dot" />YOUR AI JOB AGENT</span>
          <h1>
            <Image src="/favicon.svg" alt="" width={42} height={42} priority className="worker-home-heading-logo" />
            <span className="worker-home-heading-copy">Find Jobs with <span className="worker-home-wordmark-text">NvoidAI.com</span></span>
          </h1>
          <p>Search public job boards and company career pages. Nvoid crawls original listings for your role and location.</p>
        </div>
      </section>

      <section className="worker-home-search-section worker-home-search-v2" aria-label="Search jobs by role and location">
        <form className="worker-home-search-card" action="/job-search" method="get">
          <label className="worker-home-field" htmlFor="home-role">
            <span>ROLE, SKILL OR KEYWORD</span>
            <span className="worker-home-field-control"><BriefcaseBusiness size={20} /><input id="home-role" name="role" placeholder="e.g. Product Designer, Java Developer" autoComplete="off" required /></span>
          </label>
          <span className="worker-home-field-divider" aria-hidden="true" />
          <label className="worker-home-field" htmlFor="home-location">
            <span>LOCATION</span>
            <span className="worker-home-field-control"><Globe2 size={19} /><input id="home-location" name="location" defaultValue="Worldwide" placeholder="Country, city or remote" autoComplete="off" required /></span>
          </label>
          <button type="submit" className="worker-home-search-button"><Search size={17} />Search jobs<ArrowRight size={16} /></button>
        </form>
        <div className="worker-home-search-meta nvoid-home-search-meta">
          <div className="worker-home-search-footnote"><Search size={14} />Search public job sites and employer career pages without external job-data API integrations.</div>
          <div className="worker-home-search-footnote"><Rainbow size={14} />Model: Alpha - K1.</div>
        </div>
      </section>
    </div>
  );
}

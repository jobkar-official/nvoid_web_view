"use client";

import Image from "next/image";
import { ArrowRight, BriefcaseBusiness, Globe2, Rainbow, Search } from "lucide-react";

export default function WorkerHomepage() {
  return (
    <div className="worker-homepage worker-homepage-v2 nvoid-homepage-restored">
      <section className="worker-home-brand-intro" aria-label="NvoidAI job agent">
        <div className="worker-home-intro-copy">
          <span className="worker-home-agent-label"><span className="worker-home-agent-dot" />YOUR AI JOB AGENT</span>
          <h1>
            <div className="worker-home-heading">
              <Image
                src="/logo.png"
                alt="logo"
                width={64}
                height={64}
                priority
                style={{ filter: "brightness(0) invert(1)" }}
              />
              <span className="worker-home-heading-copy">
                NvoidAI : Your Future Career Agent
              </span>
            </div>
          </h1>
          <p>NvoidAI is your AI job agent. Enter a role and location to search public job boards and company career pages for relevant openings in one place.</p>
        </div>
      </section>

      <section className="worker-home-search-section worker-home-search-v2" aria-label="Search jobs by role and location">
        <form className="worker-home-search-card" action="/job-search" method="get">
          <label className="worker-home-field" htmlFor="home-role">
            <span>JOB TITLE OR SKILL</span>
            <span className="worker-home-field-control"><BriefcaseBusiness size={20} /><input id="home-role" name="role" placeholder="e.g. Product Designer or Java Developer" autoComplete="off" required /></span>
          </label>
          <span className="worker-home-field-divider" aria-hidden="true" />
          <label className="worker-home-field" htmlFor="home-location">
            <span>PREFERRED LOCATION</span>
            <span className="worker-home-field-control"><Globe2 size={19} /><input id="home-location" name="location" defaultValue="Worldwide" placeholder="City, country or remote" autoComplete="off" required /></span>
          </label>
          <button type="submit" className="worker-home-search-button"><Search size={17} />Find jobs<ArrowRight size={16} /></button>
        </form>
        <div className="worker-home-search-meta nvoid-home-search-meta">
          <div className="worker-home-search-footnote"><Search size={14} />One search across public job boards and company career pages.</div>
          <div className="worker-home-search-footnote"><Rainbow size={14} />Powered by Alpha - K1.</div>
        </div>
      </section>
    </div>
  );
}

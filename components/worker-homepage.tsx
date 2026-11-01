"use client";

import { Asterisk, ArrowRight, BriefcaseBusiness, Globe2, Search } from "lucide-react";

export default function WorkerHomepage() {
  return (
    <div className="worker-homepage worker-homepage-v2 nvoid-homepage-restored">
      <section className="worker-home-brand-intro" aria-label="Nvoid">
        <span className="worker-home-hero-symbol" aria-hidden="true"><Asterisk size={42} strokeWidth={1.8} /></span>
        <div className="worker-home-intro-copy">
          <span className="worker-home-intro-kicker"><span /> NVOID CAREER SEARCH</span>
          <h1>Find your next <span>opportunity</span><br /><strong>with Nvoid</strong></h1>
          <p>Search across global job sources and company career pages, all from one focused place.</p>
        </div>
      </section>

      <section className="worker-home-search-section worker-home-search-v2" aria-label="Search jobs by role and location">
        <form className="worker-home-search-card" action="/job-search" method="get">
          <label className="worker-home-field" htmlFor="home-role">
            <span>ROLE, SKILL OR KEYWORD</span>
            <span className="worker-home-field-control"><BriefcaseBusiness size={18} /><input id="home-role" name="role" placeholder="e.g. Product Designer, Java Developer" autoComplete="off" required /></span>
          </label>
          <span className="worker-home-field-divider" aria-hidden="true" />
          <label className="worker-home-field" htmlFor="home-location">
            <span>LOCATION</span>
            <span className="worker-home-field-control"><Globe2 size={18} /><input id="home-location" name="location" defaultValue="Worldwide" placeholder="Country, city or remote" autoComplete="off" required /></span>
          </label>
          <button type="submit" className="worker-home-search-button"><Search size={17} /> Search jobs <ArrowRight size={16} /></button>
        </form>
        <div className="worker-home-search-meta nvoid-home-search-meta">
          <div className="worker-home-search-footnote"><Search size={14} /> Search across connected sources. Review every result before taking action.</div>
        </div>
      </section>
    </div>
  );
}

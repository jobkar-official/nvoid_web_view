"use client";

import Image from "next/image";
import { ArrowRight, BriefcaseBusiness, Building2, Globe2, Search, ShieldCheck, Sparkles } from "lucide-react";

export default function WorkerHomepage() {
  return (
    <div className="worker-homepage worker-homepage-v2 nvoid-homepage-restored">
      <section className="worker-home-brand-intro" aria-label="NvoidAI career search">
        <div className="worker-home-intro-copy">
          <span className="worker-home-agent-label"><span className="worker-home-agent-dot" /> YOUR AI JOB AGENT</span>
          <h1>
            <span className="worker-home-heading-copy">Find Jobs with</span>
            <span className="worker-home-wordmark-text">
              <Image src="/favicon.svg" alt="" width={42} height={42} priority className="worker-home-heading-logo" />
              NvoidAI.com
            </span>
          </h1>
          <p>One intelligent search across public job sites and company career pages. Tell Nvoid what you do and where you want to work.</p>
          <div className="worker-home-proof-row" aria-label="Nvoid search features">
            <span><Globe2 size={15} /> Worldwide discovery</span>
            <span><Building2 size={15} /> Company career pages</span>
            <span><ShieldCheck size={15} /> Source-linked listings</span>
          </div>
        </div>
      </section>

      <section className="worker-home-search-section worker-home-search-v2" aria-label="Search jobs by role and location">
        <div className="worker-home-search-heading">
          <div>
            <span>START YOUR SEARCH</span>
            <h2>What opportunity are you looking for?</h2>
          </div>
          <div className="worker-home-model-badge"><Sparkles size={14} /> Alpha - K1</div>
        </div>
        <form className="worker-home-search-card" action="/job-search" method="get">
          <label className="worker-home-field" htmlFor="home-role">
            <span>ROLE, SKILL OR KEYWORD</span>
            <span className="worker-home-field-control"><BriefcaseBusiness size={19} /><input id="home-role" name="role" placeholder="e.g. Product Designer, Java Developer" autoComplete="off" required /></span>
          </label>
          <span className="worker-home-field-divider" aria-hidden="true" />
          <label className="worker-home-field" htmlFor="home-location">
            <span>LOCATION</span>
            <span className="worker-home-field-control"><Globe2 size={19} /><input id="home-location" name="location" defaultValue="Worldwide" placeholder="Country, city or remote" autoComplete="off" required /></span>
          </label>
          <button type="submit" className="worker-home-search-button"><Search size={17} /> Search jobs <ArrowRight size={16} /></button>
        </form>
        <div className="worker-home-search-meta nvoid-home-search-meta">
          <div className="worker-home-search-footnote"><ShieldCheck size={14} /> No account required to start. Review the original job source before applying.</div>
          <div className="worker-home-search-footnote"><Globe2 size={14} /> Public job sites and employer career pages.</div>
        </div>
      </section>

      <section className="worker-home-steps" aria-label="How NvoidAI works">
        <div className="worker-home-step">
          <span className="worker-home-step-number">01</span>
          <span className="worker-home-step-icon"><BriefcaseBusiness size={17} /></span>
          <div><strong>Set your direction</strong><small>Choose a role and location.</small></div>
        </div>
        <div className="worker-home-step">
          <span className="worker-home-step-number">02</span>
          <span className="worker-home-step-icon"><Globe2 size={17} /></span>
          <div><strong>Explore job sources</strong><small>Nvoid checks relevant public listings.</small></div>
        </div>
        <div className="worker-home-step">
          <span className="worker-home-step-number">03</span>
          <span className="worker-home-step-icon"><ShieldCheck size={17} /></span>
          <div><strong>Review opportunities</strong><small>Open the original source and apply.</small></div>
        </div>
      </section>
    </div>
  );
}

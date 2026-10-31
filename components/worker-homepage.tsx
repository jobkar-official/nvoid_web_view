import {
  Asterisk, ArrowRight, BrainCircuit, BriefcaseBusiness, Globe2, LockKeyhole, Search, ShieldCheck
} from "lucide-react";

export default function WorkerHomepage() {
  return (
    <div className="worker-homepage worker-homepage-v2">
      <section className="worker-home-brand-intro" aria-label="Worker">
        <div className="worker-home-brand-lockup worker-home-brand-lockup-search">
          <span className="worker-home-brand-icon worker-home-brand-icon-asterisk"><Asterisk size={48} strokeWidth={2.15} /></span>
          <span className="worker-home-brand-name">worker.com</span>
        </div>
        <div className="worker-home-intro-copy">
          <span className="worker-home-intro-kicker"><span /> AI-POWERED JOB DISCOVERY</span>
          <h1>Find your next <span>opportunity.</span></h1>
          <p>Search across public job boards and company career pages, all from one focused place.</p>
          <div className="worker-home-highlight-row" aria-label="Worker benefits">
            <span><Globe2 size={14} /> Multiple job sources</span>
            <span><ShieldCheck size={14} /> You control every application</span>
          </div>
        </div>
      </section>
      <section className="worker-home-search-section worker-home-search-v2" aria-labelledby="worker-search-heading">
        <form className="worker-home-search-card" action="/job-search" method="get">
          <label className="worker-home-field" htmlFor="home-role">
            <span>ROLE, SKILL OR KEYWORD</span>
            <span className="worker-home-field-control"><BriefcaseBusiness size={18} /><input id="home-role" name="role" placeholder="e.g. Product Designer, Java Developer" autoComplete="off" required /></span>
          </label>
          <span className="worker-home-field-divider" aria-hidden="true" />
          <label className="worker-home-field" htmlFor="home-location">
            <span>LOCATION</span>
            <span className="worker-home-field-control"><Globe2 size={18} /><input id="home-location" name="location" defaultValue="India" placeholder="City, country or Remote" autoComplete="off" required /></span>
          </label>
          <button type="submit" className="worker-home-search-button"><Search size={17} /> Search jobs <ArrowRight size={16} /></button>
        </form>
        <div className="worker-home-search-meta">
          <div className="worker-home-search-footnote"><ShieldCheck size={14} /> No account required to start. You stay in control of every application.</div>
          <span className="worker-home-model-status" role="status" aria-label="Default AI model: Alpha - k1. This model is fixed and cannot be changed here.">
            <BrainCircuit size={15} />
            <span><small>DEFAULT MODEL</small><strong>Alpha - k1</strong></span>
            <LockKeyhole size={12} />
          </span>
        </div>
      </section>

    </div>
  );
}

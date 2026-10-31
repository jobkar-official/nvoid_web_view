import Link from "next/link";
import {
  Asterisk, ArrowRight, BriefcaseBusiness, Globe2, Search, ShieldCheck
} from "lucide-react";

export default function WorkerHomepage() {
  return (
    <div className="worker-homepage worker-homepage-v2">
      <section className="worker-home-brand-intro" aria-label="Worker">
        <div className="worker-home-brand-lockup worker-home-brand-lockup-search">
          <span className="worker-home-brand-icon worker-home-brand-icon-asterisk"><Asterisk size={48} strokeWidth={2.15} /></span>
          <span className="worker-home-brand-name">worker.com</span>
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
        <div className="worker-home-search-footnote worker-home-search-footnote-centered"><ShieldCheck size={14} /> No account required to start. You stay in control of every application.</div>
      </section>

    </div>
  );
}

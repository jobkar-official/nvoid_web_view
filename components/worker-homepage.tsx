import Link from "next/link";
import {
  Asterisk, ArrowRight, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Building2,
  CheckCircle2, Globe2, Network, Puzzle, Search, ShieldCheck, Sparkles
} from "lucide-react";

const capabilities = [
  {
    icon: Globe2,
    label: "Broader discovery",
    title: "More than one job board",
    description: "Explore compatible public job feeds and company career pages from a single search.",
    href: "/sources",
    action: "Explore job sources"
  },
  {
    icon: BrainCircuit,
    label: "Relevant results",
    title: "Search with context",
    description: "Use role, location, skills and experience signals to make opportunity discovery more useful.",
    href: "/worker",
    action: "See how it works"
  },
  {
    icon: Puzzle,
    label: "Connected tools",
    title: "Extend what Worker can do",
    description: "Bring configured MCP servers and research integrations into the discovery workflow.",
    href: "/plugins",
    action: "Browse integrations"
  }
];

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
        <div className="worker-home-search-footnote"><ShieldCheck size={14} /> No account required to start. You stay in control of every application.</div>
      </section>

    </div>
  );
}

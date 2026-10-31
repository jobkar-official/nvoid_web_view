import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Building2,
  CheckCircle2, Globe2, Network, Puzzle, Search, ShieldCheck, Sparkles
} from "lucide-react";
import WorkerMark from "./worker-mark";

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
          <span className="worker-home-brand-icon"><WorkerMark size={40} /></span>
          <span className="worker-home-brand-name">Worker</span>
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

      <section className="worker-home-capabilities worker-home-capabilities-v2">
        <div className="worker-home-section-heading">
          <div><span className="worker-home-section-label">THE WORKER ADVANTAGE</span><h2>Everything connected. Search made simpler.</h2></div>
          <Link href="/worker">Explore the platform <ArrowUpRight size={15} /></Link>
        </div>
        <div className="worker-home-capability-grid">
          {capabilities.map((item, index) => {
            const Icon = item.icon;
            return (
              <article className="worker-home-capability" key={item.title}>
                <div className="worker-home-capability-top"><span className="worker-home-capability-icon"><Icon size={19} /></span><span>0{index + 1}</span></div>
                <span className="worker-home-capability-label">{item.label}</span>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <Link href={item.href}>{item.action} <ArrowRight size={14} /></Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="worker-home-flow worker-home-flow-v2">
        <div className="worker-home-flow-copy">
          <span className="worker-home-section-label">YOUR SEARCH. YOUR DECISION.</span>
          <h2>Find it. Understand it. Choose your next step.</h2>
          <p>Worker helps organize discovery. You decide which opportunities deserve your time.</p>
        </div>
        <div className="worker-home-flow-steps">
          <div><span>01</span><div><strong>Tell Worker what you want</strong><small>Start with a role, skill or location.</small></div></div>
          <div><span>02</span><div><strong>Explore connected opportunities</strong><small>Review results returned by available sources.</small></div></div>
          <div><span>03</span><div><strong>Choose where to apply</strong><small>Open the original listing and make the decision yourself.</small></div></div>
        </div>
      </section>
    </div>
  );
}

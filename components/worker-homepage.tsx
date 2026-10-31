import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Building2,
  CheckCircle2, Globe2, Network, Puzzle, Search, ShieldCheck, Sparkles
} from "lucide-react";

const capabilities = [
  {
    icon: Globe2,
    label: "Wider source coverage",
    title: "Look beyond one job board",
    description: "Bring compatible public job feeds and company career pages into a single discovery workflow.",
    href: "/sources",
    action: "Browse sources"
  },
  {
    icon: BrainCircuit,
    label: "Relevance intelligence",
    title: "Make results more meaningful",
    description: "Use role, location, skills and experience signals to surface opportunities worth reviewing.",
    href: "/worker",
    action: "Explore Worker"
  },
  {
    icon: Puzzle,
    label: "Extensible research",
    title: "Connect the tools you need",
    description: "Extend discovery and research with configured MCP servers and provider integrations.",
    href: "/plugins",
    action: "Explore integrations"
  }
];

export default function WorkerHomepage() {
  return (
    <div className="worker-homepage">
      <section className="worker-home-hero">
        <div className="worker-home-copy">
          <div className="worker-home-eyebrow"><Sparkles size={14} /> AI-POWERED JOB DISCOVERY</div>
          <h1>Find the right opportunity.<span>Across the wider job market.</span></h1>
          <p className="worker-home-description">
            Worker brings job sources, company career pages and connected research tools into one focused experience—so you can spend less time switching tabs and more time finding your next move.
          </p>
          <div className="worker-home-actions">
            <Link href="/job-search" className="worker-home-primary">Start job search <ArrowRight size={17} /></Link>
            <Link href="/worker" className="worker-home-secondary">Explore Worker <ArrowUpRight size={16} /></Link>
          </div>
          <div className="worker-home-proof">
            <span><CheckCircle2 size={15} /> Search as a guest</span>
            <span><ShieldCheck size={15} /> Review listings before applying</span>
          </div>
        </div>

        <aside className="worker-home-visual" aria-label="Illustration of Worker connecting job sources">
          <div className="worker-visual-heading">
            <span className="worker-visual-mark"><BrainCircuit size={19} /></span>
            <span><strong>Worker discovery engine</strong><small>One workflow · Connected sources</small></span>
            <span className="worker-visual-status"><i /> READY</span>
          </div>
          <div className="worker-visual-network">
            <div className="worker-visual-orbit worker-visual-orbit-one" />
            <div className="worker-visual-orbit worker-visual-orbit-two" />
            <div className="worker-visual-node worker-visual-node-top"><Globe2 size={17} /><span>Job sources</span></div>
            <div className="worker-visual-node worker-visual-node-left"><Building2 size={17} /><span>Career sites</span></div>
            <div className="worker-visual-node worker-visual-node-right"><Network size={17} /><span>MCP tools</span></div>
            <div className="worker-visual-core"><BrainCircuit size={35} /><strong>WORKER</strong><small>DISCOVER · MATCH · REVIEW</small></div>
          </div>
          <div className="worker-visual-footer">
            <span><i /> DISCOVERY</span><span><i /> NORMALIZATION</span><span><i /> RELEVANCE</span>
          </div>
        </aside>
      </section>

      <section className="worker-home-search-section" aria-labelledby="worker-search-heading">
        <div className="worker-home-search-heading">
          <div>
            <span className="worker-home-section-label">START WITH A SEARCH</span>
            <h2 id="worker-search-heading">What opportunity are you looking for?</h2>
            <p>Enter a role and location. Worker will search the sources configured for this deployment.</p>
          </div>
          <span className="worker-home-search-note"><Search size={14} /> Guest search available</span>
        </div>
        <form className="worker-home-search-card" action="/job-search" method="get">
          <label className="worker-home-field" htmlFor="home-role">
            <span>JOB TITLE OR SKILL</span>
            <span className="worker-home-field-control"><BriefcaseBusiness size={18} /><input id="home-role" name="role" placeholder="e.g. Product Designer, Java Developer" autoComplete="off" required /></span>
          </label>
          <span className="worker-home-field-divider" aria-hidden="true" />
          <label className="worker-home-field" htmlFor="home-location">
            <span>LOCATION</span>
            <span className="worker-home-field-control"><Globe2 size={18} /><input id="home-location" name="location" defaultValue="India" placeholder="City, country or Remote" autoComplete="off" required /></span>
          </label>
          <button type="submit" className="worker-home-search-button"><Search size={17} /> Find jobs <ArrowRight size={16} /></button>
        </form>
        <div className="worker-home-search-footnote"><ShieldCheck size={14} /> No account needed to start. Your guest search history stays in this browser.</div>
      </section>

      <section className="worker-home-capabilities">
        <div className="worker-home-section-heading">
          <div><span className="worker-home-section-label">MORE THAN A SEARCH BOX</span><h2>A smarter way to explore the market</h2></div>
          <Link href="/worker">See how Worker works <ArrowUpRight size={15} /></Link>
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

      <section className="worker-home-flow">
        <div className="worker-home-flow-copy">
          <span className="worker-home-section-label">A CLEARER WORKFLOW</span>
          <h2>From discovery to a decision you can trust.</h2>
          <p>Worker helps organize the search. You stay in control of what to review and where to apply.</p>
        </div>
        <div className="worker-home-flow-steps">
          <div><span>01</span><div><strong>Describe your next move</strong><small>Choose a role, skills or target location.</small></div></div>
          <div><span>02</span><div><strong>Explore connected sources</strong><small>Review normalized opportunities returned by available providers.</small></div></div>
          <div><span>03</span><div><strong>Review before you act</strong><small>Open the original listing and decide whether to apply.</small></div></div>
        </div>
      </section>
    </div>
  );
}

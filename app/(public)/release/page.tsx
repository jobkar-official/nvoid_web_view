import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  Globe2,
  Search,
  ShieldCheck,
  Sparkles,
  Target
} from "lucide-react";

export const metadata: Metadata = {
  title: "Worker Releases, Product Updates & Alpha k1",
  description: "See what is available in Worker today, explore the Alpha - k1 discovery model released on 2 October 2026, and follow product integration updates."
};

const capabilities = [
  {
    icon: Search,
    number: "01",
    name: "Multi-source job discovery",
    status: "Available in current agent",
    tone: "available",
    summary: "Search across connected job-search tools and configured public job sources in one request.",
    detail: "Worker brings returned opportunities into a consistent result format and keeps original source links available, so you can inspect the employer's listing before taking action.",
    value: "Spend less time repeating the same search across separate sources."
  },
  {
    icon: Target,
    number: "02",
    name: "Profile-based relevance matching",
    status: "Available in current agent",
    tone: "available",
    summary: "Use the role, location, skills and profile information available to rank opportunities by relevance.",
    detail: "Where source data supports it, Worker can show the signals behind a match. A score describes information alignment; it is not a probability of getting hired.",
    value: "Compare opportunities and focus on the ones that better fit your requirements."
  },
  {
    icon: Globe2,
    number: "03",
    name: "Public-web research",
    status: "Provider configuration required",
    tone: "configured",
    summary: "Research employers, career pages and public hiring information using configured search and crawling providers.",
    detail: "Depth depends on the connected search provider, credentials, public-page access and worker configuration. Results are limited to information the service can access.",
    value: "Add wider context to a job or company before deciding what to do next."
  },
  {
    icon: Sparkles,
    number: "04",
    name: "Persistent Worker agent",
    status: "Product integration in progress",
    tone: "progress",
    summary: "The account-connected agent experience is being integrated with saved professional profiles and ongoing opportunity discovery.",
    detail: "The intended workflow is to let Worker revisit relevant sources, organise new matches and bring useful opportunities back to the candidate without restarting the same manual search.",
    value: "Move from one-off searching toward a more continuous discovery workflow."
  },
  {
    icon: BriefcaseBusiness,
    number: "05",
    name: "Free employer workspace",
    status: "Workspace integration in progress",
    tone: "progress",
    summary: "The employer experience is being connected around company registration, free job posting and applicant management.",
    detail: "The intended workflow includes organising applications, comparing role-relevant candidate information and helping recruiters prioritise profiles for human review.",
    value: "Give employers a central place to publish roles and review the people who apply."
  }
];

const workflow = [
  { title: "Discover", text: "Search available job sources and connected providers for opportunities that match the request." },
  { title: "Compare", text: "Use available profile and listing information to understand role relevance and differences." },
  { title: "Review", text: "Open the original source, check the details and decide which opportunity deserves action." }
];

export default function ReleasePage() {
  return (
    <main className="release-hub">
      <nav className="release-hub-breadcrumb" aria-label="Breadcrumb"><Link href="/">Worker</Link><span>/</span><strong>Product releases</strong></nav>

      <header className="release-hub-hero">
        <div className="release-hub-hero-main">
          <span className="release-hub-eyebrow"><span /> WORKER PRODUCT JOURNAL</span>
          <h1>Know what Worker does, what is new and what is coming next.</h1>
          <p>One clear view of Worker’s job discovery engine, model releases and product integrations. We separate features available in the current agent from capabilities still being connected.</p>
          <div className="release-hub-hero-meta"><span><Clock3 size={14} /> Updated 1 November 2026</span><span><ShieldCheck size={14} /> Capability status explained</span></div>
        </div>
        <aside className="release-hub-hero-side">
          <span>THE CURRENT MODEL</span>
          <div className="release-hub-model-mark"><BrainCircuit size={23} /></div>
          <h2>Alpha - k1</h2>
          <p>Worker’s current AI-assisted job discovery and matching model.</p>
          <div className="release-hub-model-date"><span>RELEASED</span><strong>02 OCT 2026</strong></div>
          <Link href="/models/alpha-k1">Explore model details <ArrowUpRight size={15} /></Link>
        </aside>
      </header>

      <section className="release-hub-principles">
        <div><strong>Available now</strong><span>Capabilities in the current agent</span></div>
        <div><strong>Configuration dependent</strong><span>Requires an enabled provider or connector</span></div>
        <div><strong>In integration</strong><span>Being connected to the wider Worker experience</span></div>
      </section>

      <section className="release-hub-section">
        <div className="release-hub-section-heading">
          <div><span>CAPABILITY OVERVIEW</span><h2>What each part of Worker is responsible for.</h2></div>
          <p>Check the status label before relying on a capability. Integrations can vary by deployment, provider access and configuration.</p>
        </div>
        <div className="release-hub-capabilities">
          {capabilities.map((item) => {
            const Icon = item.icon;
            return <article className="release-hub-capability" key={item.name}>
              <div className="release-hub-capability-top">
                <span className="release-hub-capability-icon"><Icon size={19} /></span>
                <span className="release-hub-number">{item.number}</span>
              </div>
              <div className="release-hub-capability-title"><h3>{item.name}</h3><span className={"release-hub-status " + item.tone}>{item.status}</span></div>
              <p className="release-hub-capability-summary">{item.summary}</p>
              <p className="release-hub-capability-detail">{item.detail}</p>
              <div className="release-hub-capability-value"><CheckCircle2 size={14} /><span>{item.value}</span></div>
            </article>;
          })}
        </div>
      </section>

      <section className="release-hub-featured-release">
        <div className="release-hub-release-date"><span>MODEL RELEASE</span><strong>02</strong><small>OCT<br />2026</small></div>
        <div className="release-hub-release-copy">
          <span className="release-hub-release-kicker">CURRENT DISCOVERY MODEL</span>
          <h2>Alpha - k1</h2>
          <p>Alpha - k1 is Worker’s current AI-assisted job discovery and matching model. It helps interpret a job-search request, assess available role and profile signals, and organise opportunities for review.</p>
          <div className="release-hub-release-points"><span><CheckCircle2 size={14} /> Job relevance signals</span><span><CheckCircle2 size={14} /> Structured opportunity review</span><span><CheckCircle2 size={14} /> Human-led decisions</span></div>
          <Link href="/models/alpha-k1">Read the Alpha - k1 guide <ArrowRight size={15} /></Link>
        </div>
      </section>

      <section className="release-hub-section release-hub-workflow-section">
        <div className="release-hub-section-heading">
          <div><span>HOW THE ENGINE FITS TOGETHER</span><h2>From search request to a decision you control.</h2></div>
          <p>Worker organises the discovery process. You remain responsible for checking the source and deciding what is right for you.</p>
        </div>
        <div className="release-hub-workflow">
          {workflow.map((item, index) => <article key={item.title}>
            <span>0{index + 1}</span><h3>{item.title}</h3><p>{item.text}</p>
          </article>)}
        </div>
      </section>

      <footer className="release-hub-footer">
        <div><span>EXPLORE WORKER</span><h2>Put the current tools to work.</h2><p>Search for opportunities, understand the model behind discovery, or explore free job posting for employers.</p></div>
        <div className="release-hub-footer-actions">
          <Link href="/job-search">Find jobs <ArrowUpRight size={15} /></Link>
          <Link href="/models">Explore models <ArrowUpRight size={15} /></Link>
          <Link href="/free-job-posting">Post jobs for free <ArrowUpRight size={15} /></Link>
        </div>
      </footer>
    </main>
  );
}

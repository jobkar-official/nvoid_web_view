import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BrainCircuit, CalendarDays, CheckCircle2, Search, ShieldCheck, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = {
  title: "Worker AI Models | Alpha k1 Model Directory",
  description: "Explore the Worker AI model directory, including Alpha - k1, its job-discovery role, release date, matching signals and limitations."
};

const models = [
  {
    slug: "alpha-k1",
    name: "Alpha - k1",
    status: "Current discovery model",
    releaseDate: "2 October 2026",
    description: "Worker’s current AI-assisted job discovery and matching model. It helps interpret job-search intent, compare available opportunity details and organise relevant listings for review."
  }
];

const capabilities = [
  { icon: Search, title: "Understand the search", description: "Work with the role, skills, location and preferences in a candidate’s request." },
  { icon: Target, title: "Compare relevance", description: "Use available profile and listing signals to help prioritise opportunities." },
  { icon: ShieldCheck, title: "Keep decisions human", description: "Present evidence and source context for people to inspect before taking action." }
];

export default function ModelsPage() {
  return (
    <main className="catalog-page model-docs-page model-index-page">
      <div className="model-index-content">
        <div className="model-docs-breadcrumb"><Link href="/">Worker</Link><span>/</span><strong>Models</strong></div>

        <header className="model-index-hero">
          <span className="model-docs-eyebrow"><BrainCircuit size={15} /> WORKER / MODEL DIRECTORY</span>
          <h1>The intelligence behind a more focused job search.</h1>
          <p>Explore the model that helps Worker understand job-search requests, compare available opportunity information and organise results for review. Each model page explains its purpose, release information, capabilities and limits.</p>
          <div className="model-index-hero-meta">
            <span><CheckCircle2 size={14} /> {models.length} published model</span>
            <span><ShieldCheck size={14} /> Capability boundaries explained</span>
            <span><CalendarDays size={14} /> Model release history</span>
          </div>
        </header>

        <section className="model-index-current">
          <div className="model-index-current-heading">
            <div><span>DEFAULT MODEL</span><strong>Currently powering Worker discovery</strong></div>
            <span className="model-index-current-status"><i /> CURRENT</span>
          </div>
          {models.map((model) => (
            <article className="model-index-current-model" key={model.slug}>
              <div className="model-index-current-icon"><BrainCircuit size={27} /></div>
              <div className="model-index-current-copy">
                <div className="model-index-current-title"><h2>{model.name}</h2><span>{model.status}</span></div>
                <p>{model.description}</p>
                <div className="model-index-current-date"><CalendarDays size={14} /> Released {model.releaseDate}</div>
              </div>
              <Link href={"/models/" + model.slug} className="model-index-current-link">Open model guide <ArrowUpRight size={16} /></Link>
            </article>
          ))}
        </section>

        <section className="model-index-capabilities-section">
          <div className="model-index-capabilities-heading">
            <span>HOW THE MODEL SUPPORTS DISCOVERY</span>
            <h2>Three parts of a useful match.</h2>
          </div>
          <div className="model-index-capabilities">
            {capabilities.map((item, index) => {
              const Icon = item.icon;
              return <article key={item.title}>
                <span className="model-index-capability-number">0{index + 1}</span>
                <Icon size={21} />
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>;
            })}
          </div>
        </section>

        <footer className="model-index-footer">
          <div><span>FOR CANDIDATES AND EMPLOYERS</span><p>Worker connects job discovery with a free employer posting and hiring workspace. Explore the product release overview or start with your next opportunity.</p></div>
          <div className="model-index-footer-actions">
            <Link href="/release">Product updates <ArrowRight size={15} /></Link>
            <Link href="/free-job-posting">Free job posting <ArrowRight size={15} /></Link>
          </div>
        </footer>
      </div>
    </main>
  );
}

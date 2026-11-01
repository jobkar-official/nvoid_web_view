import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BrainCircuit, CalendarDays } from "lucide-react";

export const metadata: Metadata = {
  title: "Worker AI Models | Model Directory",
  description: "Browse Worker AI models, see their release information and explore detailed capabilities for job discovery and opportunity matching."
};

const models = [
  {
    slug: "alpha-k1",
    name: "Alpha - k1",
    status: "Current discovery model",
    releaseDate: "2 October 2026",
    description: "Worker’s current AI-assisted job discovery and matching model. Explore how it helps candidates search available sources, understand role relevance and review opportunities."
  }
];

export default function ModelsPage() {
  return (
    <main className="catalog-page model-docs-page model-index-page">
      <div className="model-index-content">
        <div className="model-docs-breadcrumb">
          <Link href="/">Worker</Link>
          <span>/</span>
          <strong>Models</strong>
        </div>

        <header className="model-index-header">
          <span className="model-docs-eyebrow"><BrainCircuit size={15} /> WORKER / MODEL DIRECTORY</span>
          <h1>Worker models</h1>
          <p>Explore the models behind Worker’s job discovery experience. Open a model to understand its purpose, capabilities, limitations, release information and how it supports the wider employment platform.</p>
        </header>

        <section className="model-index-section">
          <div className="model-index-section-heading">
            <h2>Available models</h2>
            <span>{models.length} model</span>
          </div>

          <div className="model-index-list">
            {models.map((model) => (
              <Link href={`/models/${model.slug}`} className="model-index-item" key={model.slug}>
                <div className="model-index-symbol"><BrainCircuit size={24} /></div>
                <div className="model-index-copy">
                  <div className="model-index-title-row">
                    <h3>{model.name}</h3>
                    <span>{model.status}</span>
                  </div>
                  <p>{model.description}</p>
                  <div className="model-index-meta"><CalendarDays size={14} /> Released {model.releaseDate}</div>
                </div>
                <span className="model-index-open">View model <ArrowRight size={16} /></span>
              </Link>
            ))}
          </div>
        </section>

        <footer className="model-index-footer">
          <p>Worker also provides employers with a free hiring and management workspace at zero Worker platform cost for core hiring and job management.</p>
          <Link href="/free-job-posting">Explore free hiring <ArrowRight size={15} /></Link>
        </footer>
      </div>
    </main>
  );
}

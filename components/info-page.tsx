import Link from "next/link";
import { ArrowRight, ArrowUpRight, BookOpen, BriefcaseBusiness, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export type InfoSection = { title: string; body: string };

export default function InfoPage({
  eyebrow = "NVOID",
  title,
  description,
  sections,
  updated,
  accent = "blue",
  kind = "about"
}: {
  eyebrow?: string;
  title: string;
  description: string;
  sections: InfoSection[];
  updated?: string;
  accent?: "blue" | "green";
  kind?: "about" | "legal";
}) {
  const legal = kind === "legal";

  return (
    <main className={"info-page info-page-" + kind}>
      <nav className="info-breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Nvoid</Link><span>/</span><strong>{legal ? "Trust & policies" : "About Nvoid"}</strong>
      </nav>

      <header className="info-hero">
        <div className="info-hero-top">
          <span className="info-hero-eyebrow"><span />{eyebrow}</span>
          {updated && <span className="info-updated"><BookOpen size={13} /> Last updated {updated}</span>}
        </div>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className="info-hero-meta">
          <span><ShieldCheck size={14} /> {legal ? "Nvoid trust centre" : "One employment platform"}</span>
          <span><CheckCircle2 size={14} /> {sections.length} sections</span>
        </div>
      </header>

      <div className="info-document-layout">
        <aside className="info-toc">
          <div className="info-toc-heading"><span>ON THIS PAGE</span><strong>{legal ? "Document guide" : "Explore Nvoid"}</strong></div>
          <nav aria-label="Page sections">
            {sections.map((section, index) => (
              <a href={"#info-section-" + (index + 1)} key={section.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>{section.title}
              </a>
            ))}
          </nav>
          <div className={"info-toc-note " + accent}>
            <span>{legal ? <ShieldCheck size={18} /> : <Sparkles size={18} />}</span>
            <strong>{legal ? "Read with confidence" : "Built for both sides of work"}</strong>
            <p>{legal
              ? "We explain product behaviour and distinguish current capabilities from features that depend on rollout or configuration."
              : "Candidates discover opportunities. Employers publish roles and organise hiring. Nvoid brings both journeys into one place."}</p>
            <Link href={legal ? "/about" : "/free-job-posting"}>{legal ? "About Nvoid" : "For employers"} <ArrowUpRight size={13} /></Link>
          </div>
        </aside>

        <div className="info-main">
          {sections.map((section, index) => (
            <section className="info-section" id={"info-section-" + (index + 1)} key={section.title} aria-labelledby={"info-heading-" + (index + 1)}>
              <span className="info-section-number">{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h2 id={"info-heading-" + (index + 1)}>{section.title}</h2>
                <p>{section.body}</p>
              </div>
            </section>
          ))}
        </div>
      </div>

      <footer className="info-cta">
        <div>
          <span className="info-cta-eyebrow">{legal ? "NVOID / NEXT STEP" : "YOUR NEXT STEP"}</span>
          <h2>{legal ? "Return to the Nvoid platform." : "Explore opportunities or start hiring."}</h2>
          <p>{legal
            ? "Go back to the product or learn more about how Nvoid brings candidates and employers together."
            : "Search available opportunities as a candidate, or register your company and publish jobs with no Nvoid posting fee."}</p>
        </div>
        <div className="info-cta-actions">
          <Link href={legal ? "/" : "/job-search"} className="info-cta-link">{legal ? "Back to Nvoid" : "Find jobs"} <ArrowRight size={15} /></Link>
          {!legal && <Link href="/free-job-posting" className="info-cta-secondary"><BriefcaseBusiness size={14} /> For employers</Link>}
        </div>
      </footer>
    </main>
  );
}

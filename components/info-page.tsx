import Link from "next/link";
import { ArrowRight, ArrowUpRight, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";

export type InfoSection = { title: string; body: string };

export default function InfoPage({ eyebrow = "NVOID", title, description, sections, updated, accent = "blue" }: {
  eyebrow?: string;
  title: string;
  description: string;
  sections: InfoSection[];
  updated?: string;
  accent?: "blue" | "green";
}) {
  return (
    <div className="info-page">
      <div className="info-hero">
        <span className="section-kicker">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        {updated && <span className="info-updated">Last updated {updated}</span>}
      </div>
      <div className="info-body">
        <div className="info-main">
          {sections.map((section, index) => <section className="info-section" key={section.title}>
            <span className="info-section-number">{String(index + 1).padStart(2, "0")}</span>
            <div><h2>{section.title}</h2><p>{section.body}</p></div>
          </section>)}
        </div>
        <aside className={"info-aside " + accent}>
          <span className="info-aside-icon">{accent === "green" ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}</span>
          <strong>Built around useful employment discovery</strong>
          <p>Nvoid brings public job discovery, candidate profiles and employer hiring workflows into one product.</p>
          <Link href="/models">Explore Nvoid models <ArrowRight size={14} /></Link>
        </aside>
      </div>
      <section className="info-cta">
        <div><span className="section-kicker">GET STARTED</span><h2>Explore opportunities with Nvoid.</h2><p>Search connected job sources or create a profile for personalized discovery.</p></div>
        <Link href="/" className="info-cta-link">Find jobs <ArrowUpRight size={15} /></Link>
      </section>
    </div>
  );
}

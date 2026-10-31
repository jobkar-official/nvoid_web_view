import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BrainCircuit, Bot, Building2, Globe2, LockKeyhole, Search, ShieldCheck, Target } from "lucide-react";

export const metadata: Metadata = { title: "Worker Models and AI Engines", description: "Learn how Worker's job discovery, profile matching, research and recruiter intelligence engines work." };

const models = [
  { id: "01", icon: Search, name: "Job Discovery Engine", label: "Search and retrieval", text: "Coordinates connected job-search sources, public feeds and configured career-page discovery. It normalizes job data, preserves original source links and removes duplicate opportunities where identifiers allow.", inputs: "Job title, location, country, job preferences and connected source availability.", output: "Normalized job opportunities with company, source, location, job URL and available listing details.", state: "Current agent capability" },
  { id: "02", icon: Target, name: "Profile Matching Engine", label: "Relevance and ranking", text: "Compares available job requirements with candidate profile signals such as skills, experience, role, location and preferences. Match scores are indicators of relevance, not guarantees of qualification.", inputs: "Candidate profile and structured job information.", output: "Ranked opportunities and match explanations when evidence is available.", state: "Current agent capability" },
  { id: "03", icon: Globe2, name: "Public Research Engine", label: "Web research and evidence", text: "Uses configured search and crawl connectors to research public websites, employer career pages and other accessible information. Findings retain source references so users can inspect the evidence.", inputs: "Research question and authorized connected read-only tools.", output: "Source-backed records, company findings and structured hiring research when available.", state: "Requires provider configuration" },
  { id: "04", icon: Bot, name: "Worker Personal Job Agent", label: "Continuous personalized discovery", text: "The planned persistent agent will use a candidate's saved professional profile to schedule recurring searches, compare newly discovered roles, maintain recommendations and send relevant alerts.", inputs: "Saved candidate profile, schedule, preferences and source permissions.", output: "Personalized opportunity feed, new-job notifications and supported status updates.", state: "Integration roadmap" },
  { id: "05", icon: Building2, name: "Recruiter Matching Engine", label: "Applicant intelligence", text: "The planned recruiter-side engine will compare applicants with role requirements, show skill and experience evidence, highlight gaps and group candidates for human review. It will assist recruiters rather than make automated hiring decisions.", inputs: "Employer job description and candidate applications with their permitted profile data.", output: "Explainable applicant relevance groups and review suggestions.", state: "Integration roadmap" }
];

export default function ModelsPage() {
  return <div className="catalog-page">
    <div className="catalog-hero"><span className="section-kicker">THE NVOID ENGINE</span><h1>Models built around employment.</h1><p>Worker is more than a chat interface. Its engines perform discovery, data normalization, profile matching and public-source research. Each capability has a defined input and output.</p><div className="catalog-meta"><span><ShieldCheck size={14} /> Human decisions remain in control</span><span>Current and planned capabilities are labelled separately</span></div></div>
    <section className="default-model-card" aria-label="Worker default AI model">
      <span className="default-model-icon"><BrainCircuit size={22} /></span>
      <div className="default-model-copy">
        <span className="model-label">DEFAULT AI MODEL</span>
        <h2>Alpha - k1</h2>
        <p>Alpha - k1 is the fixed default model across Worker. Model selection is managed by Worker and cannot be changed by users.</p>
      </div>
      <span className="default-model-lock"><LockKeyhole size={13} /> Locked default</span>
    </section>
    <div className="model-grid">{models.map((item) => { const Icon = item.icon; const current = item.state.includes("Current"); return <article className="model-card" key={item.id}><div className="model-card-top"><span className="model-number">{item.id}</span><span className={current ? "release-status available" : "release-status planned"}>{item.state}</span></div><div className="model-icon"><Icon size={21} /></div><span className="model-label">{item.label}</span><h2>{item.name}</h2><p>{item.text}</p><div className="model-detail"><span>INPUT</span><p>{item.inputs}</p></div><div className="model-detail"><span>OUTPUT</span><p>{item.output}</p></div></article>; })}</div>
    <div className="catalog-callout"><div><strong>Ready to explore opportunities?</strong><p>Search connected job sources without creating an account.</p></div><Link href="/">Find jobs <ArrowUpRight size={15} /></Link></div>
  </div>;
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Bot, BriefcaseBusiness, CheckCircle2, Search, Sparkles, Target } from "lucide-react";

export const metadata: Metadata = { title: "Releases and Product Updates — Worker", description: "Explore Worker product capabilities, models and release updates." };

const capabilities = [
  { icon: Search, name: "Multi-source job discovery", status: "Available in current agent", text: "Searches connected job-search MCP tools and configured public job sources in one request. Returned listings retain source and original URLs." },
  { icon: Target, name: "Profile-based matching", status: "Available in current agent", text: "Uses candidate role, location, skills and available profile details to rank relevant job opportunities and explain match reasons where source data supports them." },
  { icon: Sparkles, name: "Public web research", status: "Requires configured search provider", text: "Uses configured public-web search and page crawling to investigate companies, career pages and evidence-backed openings." },
  { icon: Bot, name: "Persistent Worker Bot", status: "Product integration in progress", text: "The planned account-connected agent will run scheduled searches against a candidate's saved professional profile and deliver new opportunity alerts." },
  { icon: BriefcaseBusiness, name: "Recruiter workspace", status: "Workspace integration in progress", text: "The planned unified workspace brings company registration, job posting, applicant management and AI-assisted candidate evaluation into Worker." }
];

export default function ReleasePage() {
  return <div className="catalog-page">
    <div className="catalog-hero"><span className="section-kicker">PRODUCT RELEASES</span><h1>What Worker can do.</h1><p>Understand the engines behind Worker, what is available in the current agent and what is being integrated into the unified employment platform.</p><div className="catalog-meta"><span><CheckCircle2 size={14} /> Product capability overview</span><span>Updated October 31, 2026</span></div></div>
    <div className="release-list">{capabilities.map((item, index) => { const Icon = item.icon; return <article className="release-card" key={item.name}><div className="release-icon"><Icon size={19} /></div><div className="release-copy"><div className="release-title-row"><h2>{item.name}</h2><span className={item.status.includes("Available") ? "release-status available" : "release-status planned"}>{item.status}</span></div><p>{item.text}</p><span className="release-version">Worker capability {String(index + 1).padStart(2, "0")}</span></div></article>; })}</div>
    <div className="catalog-callout"><div><strong>Explore the Worker model catalogue</strong><p>See how discovery, matching and research engines work together.</p></div><Link href="/models">Explore models <ArrowRight size={15} /></Link></div>
  </div>;
}

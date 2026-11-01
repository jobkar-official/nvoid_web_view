import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = {
  title: "About Worker | AI Job Discovery & Free Hiring",
  description: "Learn how Worker connects multi-source job discovery for candidates with a free job-posting and hiring workspace for employers."
};

export default function AboutPage() {
  return <InfoPage
    kind="about"
    eyebrow="ABOUT WORKER"
    title="A clearer way to discover work and build a team."
    description="Worker brings job discovery, relevance-focused candidate review and employer hiring tools into one connected employment platform. The goal is simple: make the next step in work easier to understand and act on."
    sections={[
      { title: "Why Worker exists", body: "Finding work can mean repeating the same search across job boards, company career pages and communities. Hiring can mean sorting through applications, comparing profiles and keeping follow-ups organised. Worker is designed to reduce that fragmentation by bringing opportunity discovery and hiring workflows into one place." },
      { title: "For candidates: discover with more context", body: "Search across the job sources available to Worker, compare opportunities and use role, skill, experience and location signals to understand relevance. Original source links remain important: candidates can inspect the employer's listing and decide where to apply. Worker supports your search; it does not make career decisions for you." },
      { title: "For employers: publish and review without a posting fee", body: "Employers can register a company and publish job openings without a Worker platform fee for core job posting. The hiring experience is designed to bring company details, vacancies, applicant review, shortlists and AI-assisted relevance signals into one workflow. Recruiters remain responsible for evaluating people and making hiring decisions." },
      { title: "A transparent, human-led approach", body: "Job-source access, listing quality and provider response times can vary. A match score is an indication of how available information aligns with a role or search, not a guarantee of eligibility, interview or offer. Worker aims to make the available evidence easier to review while keeping people in control of applications and hiring." }
    ]}
  />;
}

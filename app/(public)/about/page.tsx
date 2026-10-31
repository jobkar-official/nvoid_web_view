import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = { title: "About Worker", description: "Learn about Worker's AI-powered employment discovery and hiring platform." };

export default function AboutPage() {
  return <InfoPage eyebrow="ABOUT NVOID" title="A more connected way to find work and hire." description="Worker brings candidate-focused job discovery and employer hiring workflows into one AI-powered employment platform." sections={[
    { title: "Why Worker exists", body: "Job seekers often search across many job boards, company career pages and communities. Recruiters often review large applicant lists with limited context. Worker is being built to make opportunity discovery and candidate evaluation more connected." },
    { title: "For candidates", body: "Candidates can explore opportunities from connected job sources, build a professional profile and use Worker Bot to discover jobs that align with their skills, experience, education, projects and preferences." },
    { title: "For employers", body: "Employers can register their company, publish vacancies and manage applicants through a hiring workspace. Worker is designed to help recruiters understand applicant relevance through skills and experience evidence." },
    { title: "A transparent approach", body: "External opportunities retain their original source and application destination. AI recommendations are decision support: candidates and recruiters remain in control of applications and hiring decisions." }
  ]} />;
}

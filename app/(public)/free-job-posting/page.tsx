import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Sparkles, Users } from "lucide-react";

export const metadata: Metadata = { title: "Free Job Posting for Employers — Nvoid", description: "Register your company and publish jobs through Nvoid's AI-assisted hiring workspace." };

export default function FreeJobPostingPage() {
  return <div className="info-page">
    <div className="info-hero"><span className="section-kicker">FOR EMPLOYERS</span><h1>Post jobs. Find the right people.</h1><p>Build your company presence, publish vacancies and manage applicants through Nvoid's planned unified hiring workspace.</p></div>
    <div className="employer-benefit-grid">
      <article><span><Building2 size={20} /></span><h2>Company workspace</h2><p>Register your company, manage its public profile and keep hiring activity in one place.</p></article>
      <article><span><Users size={20} /></span><h2>Applicant management</h2><p>Receive applications and organize candidate review, shortlists and hiring stages.</p></article>
      <article><span><Sparkles size={20} /></span><h2>AI-assisted matching</h2><p>Review skills, experience and role-fit evidence to prioritize recruiter attention. Hiring decisions stay with people.</p></article>
    </div>
    <div className="catalog-callout"><div><strong>Recruiting without job-posting fees</strong><p>Nvoid's intended employer model keeps basic job posting free.</p></div><Link href="/auth/register?role=3">Create employer account <ArrowRight size={15} /></Link></div>
    <p className="feature-disclaimer"><CheckCircle2 size={14} /> Employer workspace and account registration depend on the production authentication and Jobkar hiring API integration.</p>
  </div>;
}

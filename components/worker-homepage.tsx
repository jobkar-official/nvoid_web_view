"use client";

import Link from "next/link";
import {
  Asterisk, ArrowRight, ArrowUpRight, Bell, BrainCircuit, BriefcaseBusiness,
  Globe2, LockKeyhole, MessageSquare, Search, ShieldCheck, Sparkles, UserRound
} from "lucide-react";
import { useAuth } from "../lib/context/AuthContext";

export default function WorkerHomepage() {
  const { user, isAuthenticated } = useAuth();
  const firstName = user?.name.split(/\s+/).filter(Boolean)[0] || "there";
  const quickLinks = user?.role === "recruiter"
    ? [
        { href: "/workspace", label: "Workspace overview", detail: "Your account and activity", icon: BrainCircuit },
        { href: "/workspace/profile", label: "Profile", detail: "Manage your professional identity", icon: UserRound },
        { href: "/workspace/messages", label: "Messages", detail: "Open your conversations", icon: MessageSquare },
        { href: "/workspace/notifications", label: "Notifications", detail: "Review account updates", icon: Bell }
      ]
    : [
        { href: "/workspace/find-jobs", label: "Find jobs", detail: "Search connected job sources", icon: Search },
        { href: "/workspace/recommendations", label: "Recommended jobs", detail: "Review matched opportunities", icon: Sparkles },
        { href: "/workspace/saved", label: "Saved jobs", detail: "Return to your shortlist", icon: BriefcaseBusiness },
        { href: "/workspace/profile", label: "Profile", detail: "Keep your profile up to date", icon: UserRound }
      ];

  return (
    <div className="worker-homepage worker-homepage-v2">
      {isAuthenticated && user && (
        <section className="worker-member-home" aria-label="Your signed-in workspace">
          <div className="worker-member-heading">
            <div>
              <span className="worker-member-eyebrow"><span /> YOUR WORKSPACE IS READY</span>
              <h2>Welcome back, {firstName}.</h2>
              <p>Signed in as {user.role === "recruiter" ? "a recruiter" : "a job seeker"}. Continue with your private workspace below.</p>
            </div>
            <Link href="/workspace" className="worker-member-overview">Open workspace <ArrowUpRight size={15} /></Link>
          </div>
          <div className="worker-member-links">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link href={item.href} key={item.href} className="worker-member-link">
                  <span className="worker-member-link-icon"><Icon size={18} /></span>
                  <span><strong>{item.label}</strong><small>{item.detail}</small></span>
                  <ArrowRight size={15} />
                </Link>
              );
            })}
          </div>
        </section>
      )}
      <section className="worker-home-brand-intro" aria-label="Worker">
        <span className="worker-home-hero-symbol" aria-hidden="true"><Asterisk size={42} strokeWidth={2.1} /></span>
        <div className="worker-home-intro-copy">
          <span className="worker-home-intro-kicker"><span /> AI-POWERED JOB DISCOVERY</span>
          <h1>Find your next <span className="worker-home-opportunity-word">opportunity</span><br /><strong>with <span className="worker-home-wordmark-text">worker.com</span></strong></h1>
          <p>Search across public job boards and company career pages, all from one focused place.</p>
          <div className="worker-home-highlight-row" aria-label="Worker benefits">
            <span><Globe2 size={14} /> Public job boards</span>
            <span><BriefcaseBusiness size={14} /> Company career pages</span>
            <span><ShieldCheck size={14} /> You control every application</span>
          </div>
        </div>
      </section>
      <section className="worker-home-search-section worker-home-search-v2" aria-label="Search jobs by role and location">
        <form className="worker-home-search-card" action="/job-search" method="get">
          <label className="worker-home-field" htmlFor="home-role">
            <span>ROLE, SKILL OR KEYWORD</span>
            <span className="worker-home-field-control"><BriefcaseBusiness size={18} /><input id="home-role" name="role" placeholder="e.g. Product Designer, Java Developer" autoComplete="off" required /></span>
          </label>
          <span className="worker-home-field-divider" aria-hidden="true" />
          <label className="worker-home-field" htmlFor="home-location">
            <span>LOCATION</span>
            <span className="worker-home-field-control"><Globe2 size={18} /><input id="home-location" name="location" defaultValue="India" placeholder="City, country or Remote" autoComplete="off" required /></span>
          </label>
          <button type="submit" className="worker-home-search-button"><Search size={17} /> Search jobs <ArrowRight size={16} /></button>
        </form>
        <div className="worker-home-search-meta">
          <div className="worker-home-search-footnote"><ShieldCheck size={14} /> {isAuthenticated ? "Your signed-in workspace is ready. You stay in control of every application." : "No account required to start. You stay in control of every application."}</div>
          <span className="worker-home-model-status" role="status" aria-label="Default AI model: Alpha - k1. This model is fixed and cannot be changed here.">
            <BrainCircuit size={15} />
            <span><small>DEFAULT MODEL</small><strong>Alpha - k1</strong></span>
            <LockKeyhole size={12} />
          </span>
        </div>
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, BriefcaseBusiness, Building2,
  CheckCircle2, ChevronDown, CircleHelp, ClipboardList, Clock3, FileText,
  LayoutDashboard, LoaderCircle, LogOut, PanelLeftClose, PanelLeftOpen, MessageSquare, Plus, Search,
  ShieldCheck, Sparkles, Target, UserRound, Users, X
} from "lucide-react";

type RoleId = 3 | 4 | 7;
type AuthSession = {
  roleId: RoleId;
  isPreview?: boolean;
  user: { id?: string; name?: string; fullName?: string; email?: string };
};
type NavItem = { id: string; label: string; icon: typeof Search };

const roleNames: Record<RoleId, string> = { 3: "Recruiter", 4: "Job seeker", 7: "Support" };
const menus: Record<RoleId, NavItem[]> = {
  3: [
    { id: "post-job", label: "Post a job", icon: Plus },
    { id: "applications", label: "Applications", icon: ClipboardList },
    { id: "highlights", label: "Highlights", icon: Target },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "company", label: "Company", icon: Building2 },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "support", label: "Support", icon: CircleHelp },
    { id: "profile", label: "Profile", icon: UserRound }
  ],
  4: [
    { id: "jobs", label: "Jobs", icon: BriefcaseBusiness },
    { id: "highlights", label: "Highlights", icon: Target },
    { id: "applied", label: "Applied", icon: ClipboardList },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "support", label: "Support", icon: CircleHelp },
    { id: "profile", label: "Profile", icon: UserRound }
  ],
  7: [
    { id: "users", label: "Users", icon: Users },
    { id: "companies", label: "Companies", icon: Building2 },
    { id: "complaints", label: "Complaints", icon: FileText },
    { id: "messages", label: "Messages", icon: MessageSquare },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: UserRound }
  ]
};

const sectionInfo: Record<string, { title: string; description: string; icon: typeof Search }> = {
  overview: { title: "Overview", description: "Your recent activity and workspace at a glance.", icon: LayoutDashboard },
  "find-jobs": { title: "Find jobs", description: "Search opportunities across the job sources connected to Nvoid.", icon: Search },
  jobs: { title: "Jobs", description: "Explore and manage the opportunities relevant to your profile.", icon: BriefcaseBusiness },
  "post-job": { title: "Post a job", description: "Publish a vacancy for candidates across the Nvoid network.", icon: Plus },
  applications: { title: "Applications", description: "Review candidates who applied to your company's openings.", icon: ClipboardList },
  applied: { title: "Applied jobs", description: "Keep track of roles you have applied to.", icon: ClipboardList },
  highlights: { title: "Highlights", description: "Your important matches, updates and recommended actions.", icon: Target },
  messages: { title: "Messages", description: "Conversations with candidates, recruiters and the Nvoid team.", icon: MessageSquare },
  company: { title: "Company", description: "Manage your company identity and hiring presence.", icon: Building2 },
  companies: { title: "Companies", description: "Review registered companies and their workspace status.", icon: Building2 },
  users: { title: "Users", description: "Manage user access and account support.", icon: Users },
  complaints: { title: "Complaints", description: "Review and manage reported issues.", icon: FileText },
  notifications: { title: "Notifications", description: "Important job, application and account updates.", icon: Bell },
  support: { title: "Support", description: "Get help with your Nvoid account and hiring workflow.", icon: CircleHelp },
  profile: { title: "Profile", description: "Manage your account and professional information.", icon: UserRound }
};

type JobResult = { id: string; title: string; company?: string; location?: string; source?: string; jobUrl?: string; applicationUrl?: string; description?: string; matchScore?: number; employmentType?: string; postedAt?: string };

function displayName(session: AuthSession) {
  return session.user.fullName || session.user.name || roleNames[session.roleId];
}
function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("") || "N";
}

export default function WorkspaceShell({ initialSession }: { initialSession: AuthSession }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activities, setActivities] = useState<Array<{ id: string; label: string; at: string }>>([]);
  const [notice, setNotice] = useState("");
  const roleId = initialSession.roleId;
  const section = pathname.split("/").filter(Boolean)[1] || "overview";
  const page = sectionInfo[section] || sectionInfo.overview;
  const navItems = menus[roleId];

  useEffect(() => {
    const key = "nvoid.workspace.activity." + (initialSession.user.id || initialSession.user.email || "member");
    try {
      const value = JSON.parse(localStorage.getItem(key) || "[]");
      if (Array.isArray(value)) setActivities(value.slice(0, 8));
    } catch {
      setActivities([]);
    }
  }, [initialSession.user.id, initialSession.user.email]);

  useEffect(() => {
    if (window.matchMedia("(max-width: 850px)").matches) setSidebarOpen(false);
    setNotice("");
  }, [pathname]);

  const closeSidebarOnMobile = () => {
    if (window.matchMedia("(max-width: 850px)").matches) setSidebarOpen(false);
  };

  const addActivity = (label: string) => {
    const key = "nvoid.workspace.activity." + (initialSession.user.id || initialSession.user.email || "member");
    const next = [{ id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), label, at: new Date().toISOString() }, ...activities].slice(0, 8);
    setActivities(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch {}
  };

  const navigate = (target: string, label: string) => {
    addActivity(label);
    closeSidebarOnMobile();
    router.push(target);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    router.replace("/");
    router.refresh();
  };

  const allowedSections = useMemo(() => new Set([...navItems.map((item) => item.id), "overview", ...(roleId === 7 ? [] : ["find-jobs"])]), [navItems, roleId]);
  useEffect(() => {
    if (section !== "overview" && !allowedSections.has(section)) router.replace("/workspace");
  }, [section, allowedSections, router]);

  return (
    <div className="workspace-shell">
      {sidebarOpen && <button className="workspace-scrim" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar" />}
      <aside id="nvoid-workspace-sidebar" aria-label="Workspace navigation" aria-hidden={!sidebarOpen} className={"workspace-sidebar" + (sidebarOpen ? " is-open" : "")}>
        <div className="workspace-sidebar-header">
          <Link className="workspace-brand" href="/workspace">
            <span className="workspace-brand-mark"><Sparkles size={19} /></span>
            <span><strong>NVOID</strong><small>Employment intelligence</small></span>
          </Link>
          <button className="workspace-sidebar-close" type="button" aria-label="Close sidebar" title="Close sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></button>
        </div>

        {roleId !== 7 && <button className="workspace-find-button" onClick={() => navigate("/workspace/find-jobs", "Opened Find jobs")}><Search size={17} /><span>Find jobs</span><ArrowUpRight size={14} /></button>}

        <div className="workspace-nav-scroll">
          <div className="workspace-nav-group">
            <span className="workspace-nav-label">Workspace</span>
            <Link href="/workspace" className={"workspace-nav-link" + (section === "overview" ? " active" : "")} onClick={() => addActivity("Opened overview")}><LayoutDashboard size={16} /><span>Overview</span></Link>
            {navItems.map((item) => {
              const Icon = item.icon;
              return <button key={item.id} className={"workspace-nav-link" + (section === item.id ? " active" : "")} onClick={() => navigate("/workspace/" + item.id, "Opened " + item.label)}><Icon size={16} /><span>{item.label}</span></button>;
            })}
          </div>
          <div className="workspace-nav-group workspace-activity-group">
            <span className="workspace-nav-label">Recent activity</span>
            {activities.length ? activities.slice(0, 5).map((item) => <div className="workspace-activity-item" key={item.id}><Clock3 size={12} /><span>{item.label}</span></div>) : <div className="workspace-activity-empty">Your recent workspace activity will appear here.</div>}
          </div>
        </div>

        <div className="workspace-sidebar-bottom">
          <div className="workspace-account">
            <span className="account-avatar">{initials(displayName(initialSession))}</span>
            <span className="account-copy"><strong>{displayName(initialSession)}</strong><small>{roleNames[roleId]}</small></span>
            <button className="account-menu-button" aria-label="Open profile" onClick={() => navigate("/workspace/profile", "Opened profile")}><ChevronDown size={15} /></button>
          </div>
          <button className="workspace-logout" onClick={logout}><LogOut size={16} /><span>Log out</span></button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="workspace-topbar">
          <button className="workspace-sidebar-toggle" type="button" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"} aria-expanded={sidebarOpen} aria-controls="nvoid-workspace-sidebar" title={sidebarOpen ? "Close sidebar" : "Open sidebar"}><PanelLeftOpen size={19} /></button>
          <div className="workspace-crumb"><span>Workspace</span><span>/</span><strong>{page.title}</strong></div>
          <div className="workspace-top-actions"><span className="workspace-role-pill">{roleNames[roleId]}</span><button className="workspace-icon-button" aria-label="Notifications" onClick={() => navigate("/workspace/notifications", "Opened notifications")}><Bell size={17} /></button><span className="workspace-top-avatar">{initials(displayName(initialSession))}</span></div>
        </header>

        <main className="workspace-content">
          {initialSession.isPreview && <div className="preview-banner"><ShieldCheck size={15} /> Development preview only. Account API and server-side data integrations are not connected.</div>}
          <div className="workspace-page-heading">
            <div><span className="workspace-eyebrow"><page.icon size={13} /> {roleNames[roleId]} workspace</span><h1>{page.title}</h1><p>{page.description}</p></div>
            <div className="workspace-heading-actions">{roleId !== 7 && <button className="workspace-primary-button" onClick={() => navigate("/workspace/find-jobs", "Started a job search")}><Search size={15} /> Find jobs</button>}</div>
          </div>
          {notice && <div className="workspace-inline-notice"><CheckCircle2 size={15} />{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X size={14} /></button></div>}
          {section === "overview" && <Overview roleId={roleId} displayName={displayName(initialSession)} activities={activities} onNavigate={navigate} />}
          {section === "find-jobs" && roleId !== 7 && <FindJobs onNotice={setNotice} />}
          {section === "post-job" && roleId === 3 && <PostJob onNotice={setNotice} />}
          {section === "profile" && <ProfilePanel session={initialSession} onNotice={setNotice} />}
          {section !== "overview" && section !== "find-jobs" && section !== "post-job" && section !== "profile" && <WorkspaceDataPanel section={section} roleId={roleId} />}
        </main>
      </div>
    </div>
  );
}

function Overview({ roleId, displayName, activities, onNavigate }: { roleId: RoleId; displayName: string; activities: Array<{ id: string; label: string; at: string }>; onNavigate: (target: string, label: string) => void }) {
  const recruiter = roleId === 3;
  const support = roleId === 7;
  const cards = support
    ? [["Users", "Account administration", Users, "/workspace/users"], ["Companies", "Employer accounts", Building2, "/workspace/companies"], ["Complaints", "Issues needing review", FileText, "/workspace/complaints"]]
    : recruiter
      ? [["Applications", "Review incoming applicants", ClipboardList, "/workspace/applications"], ["Company", "Manage your company details", Building2, "/workspace/company"], ["Messages", "Candidate conversations", MessageSquare, "/workspace/messages"]]
      : [["Jobs", "Explore relevant opportunities", BriefcaseBusiness, "/workspace/jobs"], ["Applied", "Track your applications", ClipboardList, "/workspace/applied"], ["Highlights", "Your recommended opportunities", Target, "/workspace/highlights"]];
  return (
    <div className="workspace-dashboard-grid">
      <section className="workspace-welcome-card">
        <div className="welcome-card-copy"><span className="workspace-eyebrow">YOUR WORKSPACE</span><h2>Welcome back, {displayName.split(" ")[0]}.</h2><p>{recruiter ? "Manage your vacancies, review applicants and keep your hiring moving." : support ? "Review platform activity and help keep the Nvoid experience reliable." : "Explore opportunities and let your profile help Nvoid find relevant roles."}</p>
          {!support && <button className="workspace-primary-button" onClick={() => onNavigate("/workspace/" + (recruiter ? "post-job" : "find-jobs"), recruiter ? "Started a job post" : "Started a job search")}>{recruiter ? <Plus size={15} /> : <Search size={15} />}{recruiter ? "Post a job" : "Find jobs"}<ArrowRight size={14} /></button>}
        </div>
        <div className="welcome-card-art"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-center"><Sparkles size={30} /></div></div>
      </section>
      <section className="workspace-stat-grid">
        {cards.map(([title, subtitle, Icon, href]) => {
          const CardIcon = Icon as typeof Search;
          return <button key={String(title)} className="workspace-shortcut-card" onClick={() => onNavigate(String(href), "Opened " + String(title))}><span className="shortcut-icon"><CardIcon size={18} /></span><strong>{String(title)}</strong><small>{String(subtitle)}</small><ArrowUpRight size={15} className="shortcut-arrow" /></button>;
        })}
      </section>
      <section className="workspace-content-card">
        <div className="workspace-card-heading"><div><h2>Recent activity</h2><p>Actions from this browser session.</p></div><Activity size={18} /></div>
        {activities.length ? <div className="activity-timeline">{activities.map((item) => <div className="activity-row" key={item.id}><span className="activity-dot" /><div><strong>{item.label}</strong><small>{new Date(item.at).toLocaleString()}</small></div></div>)}</div> : <EmptyPanel title="No recent activity yet" text="Your workspace activity will appear here as you use Nvoid." />}
      </section>
    </div>
  );
}

function FindJobs({ onNotice }: { onNotice: (value: string) => void }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("India");
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !location.trim()) { onNotice("Enter a job title and location."); return; }
    setLoading(true); setSearched(false); setJobs([]);
    try {
      const profile = { userId: "workspace-search", fullName: "Nvoid member", firstName: "Nvoid", lastName: "member", email: "", phone: "", jobTitle: title.trim(), location: location.trim(), countries: [location.trim()], skills: [], keywords: [title.trim()], experienceYears: 0, salaryMin: 0, salaryCurrency: "INR", employmentTypes: ["full-time"], remote: false, summary: "", linkedinUrl: "", portfolioUrl: "", resumePath: "" };
      const response = await fetch("/api/agent/search", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile, limit: 100, syncToBackend: false }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Job search could not be completed.");
      setJobs(Array.isArray(data.jobs) ? data.jobs : []); setSearched(true); onNotice((data.jobs?.length || 0) + " opportunities returned from connected sources.");
    } catch (error) { onNotice(error instanceof Error ? error.message : "Job search failed."); }
    finally { setLoading(false); }
  };
  return <section className="workspace-content-card">
    <div className="workspace-card-heading"><div><h2>Search the connected job market</h2><p>Search compatible job providers and configured public sources in one request.</p></div><Sparkles size={18} /></div>
    <form className="workspace-search-form" onSubmit={submit}>
      <label>Job title or skill<input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Java Backend Developer" /></label>
      <label>Location<input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, country or Remote" /></label>
      <button className="workspace-primary-button" disabled={loading}>{loading ? <LoaderCircle className="spin" size={16} /> : <Search size={16} />}{loading ? "Searching sources" : "Find jobs"}</button>
    </form>
    {jobs.length > 0 && <div className="workspace-job-list">{jobs.map((job) => <article className="workspace-job-row" key={job.id}><div><strong>{job.title}</strong><span>{job.company || "Company not listed"} · {job.location || "Location not listed"}</span><small>{job.source || "Connected source"}{job.employmentType ? " · " + job.employmentType : ""}</small></div>{(job.applicationUrl || job.jobUrl) && <a href={job.applicationUrl || job.jobUrl} target="_blank" rel="noreferrer">View <ArrowUpRight size={13} /></a>}</article>)}</div>}
    {searched && jobs.length === 0 && <EmptyPanel title="No matching opportunities returned" text="Try a broader title or location. Nvoid only shows results returned by connected sources." />}
  </section>;
}

function PostJob({ onNotice }: { onNotice: (value: string) => void }) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("Full-time");
  return <section className="workspace-content-card">
    <div className="workspace-card-heading"><div><h2>Create a vacancy</h2><p>Prepare a job listing for your company. Live publishing requires the Jobkar hiring API integration.</p></div><Plus size={18} /></div>
    <form className="workspace-form-grid" onSubmit={(event) => { event.preventDefault(); onNotice("The job-posting interface is ready. Connect the Jobkar Workspace job-create endpoint before publishing live vacancies."); }}>
      <label>Job title<input required value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Senior Java Developer" /></label>
      <label>Location<input required value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. Bengaluru, India" /></label>
      <label>Employment type<select value={type} onChange={(event) => setType(event.target.value)}><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Internship</option></select></label>
      <label className="full-span">Job description<textarea required rows={7} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Responsibilities, required skills, experience and expectations..." /></label>
      <div className="full-span workspace-form-actions"><span>Free job posting · No payment required</span><button className="workspace-primary-button" type="submit"><Plus size={15} /> Continue</button></div>
    </form>
  </section>;
}

function ProfilePanel({ session, onNotice }: { session: AuthSession; onNotice: (value: string) => void }) {
  const [name, setName] = useState(displayName(session));
  const [email, setEmail] = useState(session.user.email || "");
  return <section className="workspace-content-card">
    <div className="workspace-card-heading"><div><h2>Account profile</h2><p>Your account identity and professional information.</p></div><UserRound size={18} /></div>
    <form className="workspace-form-grid" onSubmit={(event) => { event.preventDefault(); onNotice("Profile changes are not saved yet. Connect the authenticated profile API to persist this information."); }}>
      <label>Full name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
      <label>Email address<input value={email} onChange={(event) => setEmail(event.target.value)} type="email" /></label>
      <label>Role<input value={roleNames[session.roleId]} disabled /></label>
      <label>Account ID<input value={session.user.id || "Provided by authentication service"} disabled /></label>
      <div className="full-span workspace-form-actions"><span>Profile sync requires the authenticated account API.</span><button className="workspace-primary-button" type="submit">Save changes</button></div>
    </form>
  </section>;
}

const dataCopy: Record<string, { heading: string; text: string; icon: typeof Search; action?: string }> = {
  jobs: { heading: "Your job recommendations will appear here", text: "Search the connected market or use Nvoid Bot to discover roles that fit your professional profile.", icon: BriefcaseBusiness, action: "Find jobs" },
  applied: { heading: "No applications to show yet", text: "Applications submitted through connected workflows will appear here with their latest verifiable status.", icon: ClipboardList, action: "Find jobs" },
  applications: { heading: "No applications received yet", text: "Applications to your company's published jobs will appear here when the hiring API is connected.", icon: ClipboardList, action: "Post a job" },
  highlights: { heading: "Your highlights will appear here", text: "Important job matches, application updates and hiring insights will be collected here.", icon: Target },
  messages: { heading: "No conversations yet", text: "Candidate and recruiter conversations will appear here when messaging is connected.", icon: MessageSquare },
  company: { heading: "Company profile is not connected", text: "Your registered company identity, active vacancies and hiring team will appear here.", icon: Building2 },
  companies: { heading: "Company directory is not connected", text: "Registered employer records will appear here for support review.", icon: Building2 },
  users: { heading: "User management is not connected", text: "Authorized user records and account actions will appear here.", icon: Users },
  complaints: { heading: "No complaint records available", text: "Support cases and reported issues will appear here when the support API is connected.", icon: FileText },
  notifications: { heading: "You're all caught up", text: "Job recommendations, application updates and account notifications will appear here.", icon: Bell },
  support: { heading: "How can we help?", text: "Support requests and their responses will be available here when the support service is connected.", icon: CircleHelp }
};

function WorkspaceDataPanel({ section, roleId }: { section: string; roleId: RoleId }) {
  const item = dataCopy[section] || dataCopy.highlights;
  const Icon = item.icon;
  const buttonTarget = item.action === "Post a job" ? "/workspace/post-job" : "/workspace/find-jobs";
  return <div className="workspace-data-layout">
    <section className="workspace-content-card"><div className="workspace-empty-state"><span className="workspace-empty-icon"><Icon size={24} /></span><h2>{item.heading}</h2><p>{item.text}</p>{item.action && roleId !== 7 && <Link className="workspace-primary-button" href={buttonTarget}>{item.action === "Post a job" ? <Plus size={15} /> : <Search size={15} />}{item.action}<ArrowRight size={14} /></Link>}</div></section>
    <aside className="workspace-tip-card"><span className="workspace-tip-icon"><ShieldCheck size={18} /></span><strong>Private workspace</strong><p>Account-specific information is only shown after authentication. Live records require their corresponding account APIs.</p></aside>
  </div>;
}

function EmptyPanel({ title, text }: { title: string; text: string }) {
  return <div className="workspace-empty-state compact"><span className="workspace-empty-icon"><BriefcaseBusiness size={22} /></span><h3>{title}</h3><p>{text}</p></div>;
}

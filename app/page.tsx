"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  Activity, ArrowRight, ArrowUpRight, Bell, Briefcase, Check, CheckCircle2,
  ChevronRight, CircleHelp, Clock3, Database, ExternalLink, FileText, Filter,
  Globe2, LayoutDashboard, LoaderCircle, MapPin, Menu, RefreshCw, Search,
  SearchCheck, Settings, ShieldCheck, Sparkles, Target, UserRound, Workflow,
  X, Zap, Building2, SlidersHorizontal, Bookmark, ClipboardList, Link2, Mail,
  Phone, Save, Server, Code2, CircleAlert, ListChecks
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type View = "overview" | "jobs" | "applications" | "profile" | "settings";
type Notice = { type: "error" | "success" | "info"; message: string };
type CandidateProfile = {
  userId: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  location: string;
  countries: string[];
  skills: string[];
  keywords: string[];
  experienceYears: number;
  salaryMin: number;
  salaryCurrency: string;
  employmentTypes: string[];
  remote: boolean;
  summary: string;
  linkedinUrl: string;
  portfolioUrl: string;
  resumePath: string;
};
type Job = {
  id: string;
  source?: string;
  sourceJobId?: string;
  title: string;
  company?: string;
  location?: string;
  country?: string;
  description?: string;
  jobUrl?: string;
  applicationUrl?: string;
  employmentType?: string;
  workMode?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  matchScore: number;
  matchReasons?: string[];
  demo?: boolean;
};
type ApplicationTask = {
  taskId?: string;
  state?: string;
  progress?: number | string;
  attemptsMade?: number;
  failedReason?: string;
  createdAt?: string;
  processedAt?: string;
  finishedAt?: string;
  userId?: string;
  job?: { id?: string; title?: string; company?: string; source?: string; applicationUrl?: string };
  result?: { status?: string; message?: string; applicationUrl?: string; screenshotPath?: string };
};
type AgentHealth = { status?: string; service?: string; mcp?: { configured?: number; connected?: number } };

const initialProfile: CandidateProfile = {
  userId: "nvoid-demo-candidate-001",
  fullName: "Aarav Sharma",
  firstName: "Aarav",
  lastName: "Sharma",
  email: "aarav.demo@example.com",
  phone: "+91 90000 12345",
  jobTitle: "Software Developer",
  location: "Worldwide",
  countries: ["India", "Germany", "United Kingdom", "Canada", "Worldwide"],
  skills: ["TypeScript", "JavaScript", "React", "Node.js", "Java", "Spring Boot", "Python", "Redis"],
  keywords: ["backend", "full stack", "API", "remote"],
  experienceYears: 3,
  salaryMin: 1200000,
  salaryCurrency: "INR",
  employmentTypes: ["full-time"],
  remote: true,
  summary: "Demo candidate profile for testing the Nvoid discovery and application workflow. Replace these values with accurate candidate details before any real application.",
  linkedinUrl: "https://www.linkedin.com/in/demo-candidate/",
  portfolioUrl: "https://example.com/portfolio",
  resumePath: ""
};

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Find jobs", icon: Search },
  { id: "applications", label: "Applications", icon: ClipboardList },
  { id: "profile", label: "Candidate profile", icon: UserRound },
  { id: "settings", label: "Connections & settings", icon: Settings }
];

const pageInfo: Record<View, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "Your job search workspace", title: "Overview", description: "One workspace to discover opportunities, compare your fit, and track every agent task." },
  jobs: { eyebrow: "Opportunity discovery", title: "Find your next role", description: "Search connected job sources and review matches against your candidate profile." },
  applications: { eyebrow: "Execution history", title: "Application tracker", description: "Review queued tasks, completion states, and jobs that need your attention." },
  profile: { eyebrow: "Candidate intelligence", title: "Your candidate profile", description: "Keep the test profile accurate so the agent can search and match against the right criteria." },
  settings: { eyebrow: "Agent configuration", title: "Connections & settings", description: "Check the worker connection, choose a source, and review submission safeguards." }
};

async function readJson(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof data.error === "string" ? data.error : "The request could not be completed.");
  }
  return data;
}

function toTasks(value: unknown): ApplicationTask[] {
  if (Array.isArray(value)) return value as ApplicationTask[];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (Array.isArray(record.tasks)) return record.tasks as ApplicationTask[];
    if (Array.isArray(record.items)) return record.items as ApplicationTask[];
    if (Array.isArray(record.data)) return record.data as ApplicationTask[];
  }
  return [];
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "ND";
}

function money(min?: number, max?: number, currency?: string) {
  if (min === undefined && max === undefined) return "Salary not listed";
  const symbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : currency === "CAD" ? "CA$" : currency ? currency + " " : "";
  const fmt = (value: number) => value >= 1000000 ? (value / 1000000).toFixed(value % 1000000 === 0 ? 0 : 1) + "M" : value >= 1000 ? Math.round(value / 1000) + "K" : String(value);
  if (min !== undefined && max !== undefined) return symbol + fmt(min) + " – " + symbol + fmt(max);
  return symbol + fmt((min ?? max) as number) + (min !== undefined ? "+" : "");
}

function taskStatus(task: ApplicationTask) {
  return String(task.result?.status || task.state || "waiting").toLowerCase().replace(/\s+/g, "_");
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    applied: "Applied", needs_user_action: "Needs your review", failed: "Failed",
    skipped: "Skipped", waiting: "Queued", active: "In progress",
    completed: "Completed", delayed: "Delayed", unknown: "Unknown"
  };
  return labels[status] || status.replace(/_/g, " ").replace(/^\w/, (char) => char.toUpperCase());
}

export default function HomePage() {
  const [view, setView] = useState<View>("overview");
  const [profile, setProfile] = useState<CandidateProfile>(initialProfile);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [tasks, setTasks] = useState<ApplicationTask[]>([]);
  const [health, setHealth] = useState<AgentHealth | null>(null);
  const [agentState, setAgentState] = useState<"checking" | "online" | "offline">("checking");
  const [busy, setBusy] = useState<"search" | "run" | "refresh" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const [minMatchScore, setMinMatchScore] = useState(55);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastSearch, setLastSearch] = useState<string | null>(null);
  const [taskRefreshError, setTaskRefreshError] = useState("");

  const connectedSources = health?.mcp?.connected ?? 0;
  const matchedJobs = useMemo(() => jobs.filter((job) => job.matchScore >= minMatchScore).length, [jobs, minMatchScore]);
  const appliedTasks = useMemo(() => tasks.filter((task) => taskStatus(task) === "applied").length, [tasks]);
  const needsActionTasks = useMemo(() => tasks.filter((task) => taskStatus(task) === "needs_user_action" || taskStatus(task) === "failed").length, [tasks]);
  const queuedTasks = useMemo(() => tasks.filter((task) => ["waiting", "active", "delayed"].includes(taskStatus(task))).length, [tasks]);
  const currentInfo = pageInfo[view];

  const loadHealth = useCallback(async () => {
    setAgentState("checking");
    try {
      const result = await readJson(await fetch("/api/agent/health", { cache: "no-store" }));
      setHealth(result as AgentHealth);
      setAgentState(result.status === "ok" ? "online" : "offline");
    } catch {
      setAgentState("offline");
      setHealth(null);
    }
  }, []);

  const loadTasks = useCallback(async () => {
    try {
      const result = await readJson(await fetch("/api/agent/applications", { cache: "no-store" }));
      setTasks(toTasks(result));
      setTaskRefreshError("");
    } catch (error) {
      setTaskRefreshError(error instanceof Error ? error.message : "Could not load application tasks.");
    }
  }, []);

  const refreshWorkspace = useCallback(async () => {
    setBusy("refresh");
    await Promise.all([loadHealth(), loadTasks()]);
    setBusy(null);
  }, [loadHealth, loadTasks]);

  useEffect(() => {
    void loadHealth();
    void loadTasks();
  }, [loadHealth, loadTasks]);

  const updateProfile = <K extends keyof CandidateProfile,>(key: K, value: CandidateProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const searchJobs = async (event?: FormEvent) => {
    event?.preventDefault();
    setBusy("search");
    setNotice(null);
    try {
      const result = await readJson(await fetch("/api/agent/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: { ...profile },
          limit: 100,
          syncToBackend: false
        })
      }));
      setJobs(Array.isArray(result.jobs) ? result.jobs as Job[] : []);
      setLastSearch(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      setView("jobs");
      const foundCount = result.returnedCount ?? result.jobs?.length ?? 0;
      const sourceErrors = Array.isArray(result.sources) ? result.sources.filter((source: { error?: string }) => Boolean(source.error)) : [];
      setNotice({ type: sourceErrors.length > 0 && foundCount === 0 ? "error" : sourceErrors.length > 0 ? "info" : "success", message: sourceErrors.length > 0 ? "Search returned " + foundCount + " job(s); source issue: " + sourceErrors.map((source: { serverId?: string; error?: string }) => (source.serverId || "source") + ": " + (source.error || "unknown error")).join(" · ") : "Search completed. Found " + foundCount + " normalized job matches across " + (result.sourceCount ?? 0) + " source(s)." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Job search failed." });
      await loadHealth();
    } finally {
      setBusy(null);
    }
  };

  const runAgent = async () => {
    setBusy("run");
    setNotice(null);
    try {
      const result = await readJson(await fetch("/api/agent/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: profile.userId,
          profile: { ...profile },
          searchLimit: 50,
          applyLimit: 10,
          minMatchScore,
          autoSubmit: false,
          syncToBackend: false
        })
      }));
      if (Array.isArray(result.search?.jobs)) setJobs(result.search.jobs as Job[]);
      await loadTasks();
      setView("applications");
      const queuedCount = result.applicationQueue?.queued ?? 0;
      const queueNote = typeof result.applicationQueue?.note === "string" ? result.applicationQueue.note : "";
      setNotice({ type: queuedCount > 0 ? "success" : "info", message: queuedCount > 0 ? "Agent run completed. Queued " + queuedCount + " task(s) in review-only mode. No real application was submitted by this UI." : queueNote || "The agent found no jobs with a supported direct application route to queue." });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "The agent could not complete this run." });
      await loadHealth();
    } finally {
      setBusy(null);
    }
  };

  const saveProfile = (event: FormEvent) => {
    event.preventDefault();
    setNotice({ type: "success", message: "Demo profile updated in this browser session. These dummy details are not saved to your backend." });
  };

  const goTo = (next: View) => {
    setView(next);
    setMobileOpen(false);
    setNotice(null);
  };

  const statusClass = agentState === "online" ? "" : agentState === "offline" ? "offline" : "warning";
  const statusText = agentState === "checking" ? "Checking agent" : agentState === "offline" ? "Agent offline" : connectedSources > 0 ? "Agent connected" : "Agent online · no source";

  return (
    <div className="app-shell">
      {mobileOpen && <button aria-label="Close navigation" className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={"sidebar" + (mobileOpen ? " mobile-open" : "")}>
        <div className="brand-row">
          <div className="brand-mark"><Sparkles size={19} strokeWidth={2.2} /></div>
          <div><div className="brand-name">NVOID</div><div className="brand-caption">AI job agent</div></div>
        </div>
        <div className="nav-label">Workspace</div>
        <nav className="nav-list" aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item.id} className={"nav-item" + (view === item.id ? " active" : "")} onClick={() => goTo(item.id)}>
              <item.icon size={16} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.id === "applications" && tasks.length > 0 && <span className="nav-count">{tasks.length}</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-connection">
          <div className="side-connection-title"><Activity size={15} /> Agent connection</div>
          <p className="side-connection-copy">Your workspace talks to the Nvoid worker through a private server-side API connection.</p>
          <div className="side-connection-footer"><span className={"status-dot " + statusClass} />{agentState === "online" ? (connectedSources + " source(s) connected") : statusText}</div>
        </div>
        <div className="sidebar-footer">
          <div className="avatar avatar-sm">{initials(profile.fullName)}</div>
          <div className="sidebar-user"><strong>{profile.fullName} · Demo</strong><span>Test candidate profile</span></div>
          <button aria-label="Open profile" className="icon-button" onClick={() => goTo("profile")}><ChevronRight size={15} /></button>
        </div>
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <button aria-label="Open navigation" className="icon-button mobile-menu" onClick={() => setMobileOpen(true)}><Menu size={17} /></button>
          <div className="breadcrumb"><span>Nvoid workspace</span><ChevronRight size={13} /><strong>{currentInfo.title}</strong></div>
          <div className="topbar-spacer" />
          <div className="topbar-status"><span className={"status-dot " + statusClass} />{statusText}</div>
          <button aria-label="Refresh connection and task list" className="icon-button" onClick={refreshWorkspace} disabled={busy !== null}><RefreshCw size={15} className={busy === "refresh" ? "spin" : ""} /></button>
          <div className="topbar-user">
            <div className="avatar avatar-sm">{initials(profile.fullName)}</div>
            <div className="topbar-user-text"><strong>{profile.fullName}</strong><span>Demo workspace</span></div>
          </div>
        </header>

        <main className="content">
          <div className="page-heading">
            <div>
              <div className="eyebrow"><Sparkles size={13} /> {currentInfo.eyebrow}</div>
              <h1>{currentInfo.title}</h1>
              <p>{currentInfo.description}</p>
            </div>
            <div className="heading-actions">
              <button className="secondary-button" onClick={() => void searchJobs()} disabled={busy !== null}><Search size={15} /> Find jobs</button>
              <button className="primary-button" onClick={runAgent} disabled={busy !== null || agentState === "offline"}>{busy === "run" ? <LoaderCircle size={15} className="spin" /> : <Zap size={15} />} Run agent <ArrowRight size={14} /></button>
            </div>
          </div>

          {showDemoBanner && <div className="demo-banner"><ShieldCheck size={17} /><div className="demo-banner-copy"><strong>Live job search is enabled.</strong> The candidate profile still contains fictional test details. Searches use the live Jobicy and Remote OK feeds, preserve source attribution, and link to original provider listings. Agent runs remain review-only and do not sync to the Jobkar backend or submit applications.</div><button className="demo-banner-close" aria-label="Dismiss notice" onClick={() => setShowDemoBanner(false)}><X size={15} /></button></div>}
          {notice && <div className={"notice " + notice.type}><div>{notice.type === "error" ? <CircleAlert size={16} /> : notice.type === "success" ? <CheckCircle2 size={16} /> : <Activity size={16} />}</div><div>{notice.message}</div><button className="demo-banner-close" aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={14} /></button></div>}

          {view === "overview" && (
            <>
              <div className="grid metric-grid">
                <MetricCard label="Jobs discovered" value={jobs.length} foot={lastSearch ? "Last search at " + lastSearch : "Run a search to populate"} icon={SearchCheck} />
                <MetricCard label="Strong profile matches" value={matchedJobs} foot={"Match threshold: " + minMatchScore + "%"} icon={Target} tone="blue" />
                <MetricCard label="Application tasks" value={tasks.length} foot={queuedTasks + " queued or in progress"} icon={Workflow} tone="purple" />
                <MetricCard label="Need your attention" value={needsActionTasks} foot={appliedTasks + " confirmed as applied"} icon={Clock3} tone="amber" />
              </div>
              <div className="grid content-grid">
                <section className="panel">
                  <div className="panel-header"><div><h2 className="panel-title">Recommended opportunities</h2><p className="panel-subtitle">Best scoring jobs from your latest search</p></div><button className="text-link" onClick={() => goTo("jobs")}>View all <ArrowUpRight size={14} /></button></div>
                  <div className="panel-body">
                    {jobs.length > 0 ? <div className="job-list">{jobs.slice(0, 3).map((job) => <JobCard key={job.id} job={job} />)}</div> : <EmptyState icon={SearchCheck} title="No jobs discovered yet" description="Search the connected live job source to load current listings and rank them against your target role and location preferences." buttonText="Search live jobs" onAction={() => void searchJobs()} loading={busy === "search"} />}
                  </div>
                </section>
                <div className="grid">
                  <section className="panel">
                    <div className="panel-header"><div><h2 className="panel-title">Agent pipeline</h2><p className="panel-subtitle">Your job search, from source to tracked task</p></div><Workflow size={17} color="#6b83ad" /></div>
                    <div className="panel-body"><PipelineSteps hasJobs={jobs.length > 0} hasTasks={tasks.length > 0} hasSource={connectedSources > 0} /></div>
                  </section>
                  <section className="panel">
                    <div className="panel-header"><div><h2 className="panel-title">Connection status</h2><p className="panel-subtitle">Worker health and active sources</p></div><button className="icon-button" aria-label="Refresh status" onClick={refreshWorkspace} disabled={busy !== null}><RefreshCw size={14} className={busy === "refresh" ? "spin" : ""} /></button></div>
                    <div className="panel-body">
                      <div className="info-row"><div className="info-row-icon"><Server size={15} /></div><div className="info-row-copy"><strong>{agentState === "online" ? "Agent API reachable" : agentState === "checking" ? "Checking agent API" : "Agent API unavailable"}</strong><span>{health?.service || "job-agent-worker"}{health?.status ? " · " + health.status : ""}</span></div></div>
                      <div className="info-row"><div className="info-row-icon"><Database size={15} /></div><div className="info-row-copy"><strong>{connectedSources} source(s) connected</strong><span>Searches use the enabled live source IDs configured on the worker. Listings retain provider attribution and are ranked against your profile.</span></div></div>
                      <div className="info-row"><div className="info-row-icon"><ShieldCheck size={15} /></div><div className="info-row-copy"><strong>Review-only submission</strong><span>The UI passes autoSubmit=false on every agent run.</span></div></div>
                      <button className="secondary-button full-width" style={{ marginTop: 17 }} onClick={() => goTo("settings")}>Connection settings <ArrowRight size={14} /></button>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}

          {view === "jobs" && (
            <section className="panel">
              <div className="panel-header"><div><h2 className="panel-title">Job discovery</h2><p className="panel-subtitle">Live listings returned by connected job sources and matched against your role and geographic preferences.</p></div></div>
              <div className="panel-body">
                <form className="search-bar" onSubmit={searchJobs}>
                  <div className="field-wrap"><label htmlFor="search-role">Target role</label><input id="search-role" className="field" value={profile.jobTitle} onChange={(event) => updateProfile("jobTitle", event.target.value)} placeholder="Software Developer" /></div>
                  <div className="field-wrap"><label htmlFor="search-location">Location</label><input id="search-location" className="field" value={profile.location} onChange={(event) => updateProfile("location", event.target.value)} placeholder="Worldwide, Remote, Bengaluru..." /></div>
                  <div className="field-wrap"><label>&nbsp;</label><button className="primary-button full-width" type="submit" disabled={busy !== null}>{busy === "search" ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />} Search jobs</button></div>
                </form>
                <div className="filter-row"><div className="source-controls"><span className="result-count"><strong>{jobs.length}</strong> job(s) found</span><span className="tag"><Filter size={12} /> Match score {minMatchScore}%+</span></div><div className="source-controls"><label htmlFor="min-score" className="field-help">Match threshold</label><select id="min-score" className="field" style={{ width: 100, minHeight: 32, padding: "6px 8px" }} value={minMatchScore} onChange={(event) => setMinMatchScore(Number(event.target.value))}><option value={40}>40%</option><option value={50}>50%</option><option value={55}>55%</option><option value={60}>60%</option><option value={70}>70%</option><option value={80}>80%</option></select><button className="secondary-button button-small" onClick={runAgent} disabled={busy !== null || agentState === "offline"}>{busy === "run" ? <LoaderCircle size={13} className="spin" /> : <Zap size={13} />} Run & queue</button></div></div>
                {jobs.length > 0 ? <div className="job-list">{jobs.map((job) => <JobCard key={job.id} job={job} />)}</div> : <EmptyState icon={Globe2} title="Search across your sources" description="Search current listings from the enabled live feed. This initial connector covers remote roles and may not include every city, onsite role, or job portal." buttonText="Search live jobs" onAction={() => void searchJobs()} loading={busy === "search"} />}
              </div>
            </section>
          )}

          {view === "applications" && (
            <section className="panel">
              <div className="panel-header"><div><h2 className="panel-title">Application task history</h2><p className="panel-subtitle">Redis-backed queue states and reported execution results from the agent worker.</p></div><button className="secondary-button button-small" onClick={loadTasks} disabled={busy !== null}><RefreshCw size={13} /> Refresh tasks</button></div>
              {taskRefreshError && <div className="notice error" style={{ margin: 16, marginBottom: 0 }}><CircleAlert size={15} />{taskRefreshError}</div>}
              <div className="table-wrap">
                <table className="data-table">
                  <thead><tr><th>Job / company</th><th>Status</th><th>Created</th><th>Source</th><th>Application</th></tr></thead>
                  <tbody>
                    {tasks.length === 0 ? <tr><td colSpan={5}><div className="table-empty"><ClipboardList size={25} style={{ margin: "0 auto 10px", color: "#a5b2c5" }} /><strong style={{ display: "block", color: "#596b84", marginBottom: 5 }}>No application tasks yet</strong>Run the agent in review-only mode to inspect supported application tasks. Public aggregator listings without a verified employer application URL are not queued for automated application.</div></td></tr> : tasks.map((task) => {
                      const status = taskStatus(task);
                      const jobUrl = task.result?.applicationUrl || task.job?.applicationUrl;
                      return <tr key={task.taskId || task.job?.id || task.createdAt}>
                        <td><div className="table-main">{task.job?.title || "Application task"}</div><div className="table-secondary">{task.job?.company || "Company not listed"} · {String(task.taskId || "").slice(0, 10)}</div></td>
                        <td><span className={"status-pill status-" + status}><span className="status-dot" style={{ width: 5, height: 5, boxShadow: "none", background: "currentColor" }} />{statusLabel(status)}</span>{task.result?.message && <div className="table-secondary" style={{ whiteSpace: "normal", maxWidth: 260, marginTop: 6 }}>{task.result.message}</div>}{task.failedReason && <div className="table-secondary" style={{ whiteSpace: "normal", maxWidth: 220, marginTop: 6 }}>{task.failedReason}</div>}</td>
                        <td>{task.createdAt ? new Date(task.createdAt).toLocaleString() : "—"}</td>
                        <td>{task.job?.source || "—"}</td>
                        <td>{jobUrl ? <a className="text-link" href={jobUrl} target="_blank" rel="noreferrer">Open <ExternalLink size={12} /></a> : "—"}</td>
                      </tr>;
                    })}
                  </tbody>
                </table>
              </div>
              <div className="panel-body" style={{ borderTop: "1px solid #eef2f7" }}><div className="notice info" style={{ margin: 0 }}><ShieldCheck size={15} />A queued or completed queue task is not proof that an application was submitted. Only a verifiable agent result should be treated as applied.</div></div>
            </section>
          )}

          {view === "profile" && (
            <div className="grid profile-layout">
              <form className="panel form-panel" onSubmit={saveProfile}>
                <h2 className="form-section-title">Candidate details</h2><p className="form-section-copy">This test profile is stored in the current browser session only. Replace the sample values before testing a real candidate account.</p>
                <div className="form-grid">
                  <div className="field-wrap"><label htmlFor="full-name">Full name</label><input id="full-name" className="field" value={profile.fullName} onChange={(event) => { const fullName = event.target.value; const parts = fullName.trim().split(/\s+/); updateProfile("fullName", fullName); updateProfile("firstName", parts[0] || ""); updateProfile("lastName", parts.slice(1).join(" ")); }} /></div>
                  <div className="field-wrap"><label htmlFor="email">Email</label><input id="email" type="email" className="field" value={profile.email} onChange={(event) => updateProfile("email", event.target.value)} /></div>
                  <div className="field-wrap"><label htmlFor="phone">Phone</label><input id="phone" className="field" value={profile.phone} onChange={(event) => updateProfile("phone", event.target.value)} /></div>
                  <div className="field-wrap"><label htmlFor="job-title">Target role</label><input id="job-title" className="field" value={profile.jobTitle} onChange={(event) => updateProfile("jobTitle", event.target.value)} /></div>
                  <div className="field-wrap"><label htmlFor="location">Preferred location</label><input id="location" className="field" value={profile.location} onChange={(event) => updateProfile("location", event.target.value)} /></div>
                  <div className="field-wrap"><label htmlFor="experience">Experience (years)</label><input id="experience" type="number" min="0" max="80" className="field" value={profile.experienceYears} onChange={(event) => updateProfile("experienceYears", Math.max(0, Number(event.target.value)))} /></div>
                  <div className="field-wrap span-2"><label htmlFor="countries">Preferred countries / markets</label><input id="countries" className="field" value={profile.countries.join(", ")} onChange={(event) => updateProfile("countries", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /><span className="field-help">Separate countries with commas. Use Worldwide to include global/remote results where the source supports it.</span></div>
                  <div className="field-wrap span-2"><label>Employment types</label><div className="checkbox-chips">{[["full-time", "Full-time"], ["part-time", "Part-time"], ["internship", "Internship"], ["contract", "Contract"], ["temporary", "Temporary"]].map(([value, label]) => <label key={value} className="checkbox-chip"><input type="checkbox" checked={profile.employmentTypes.includes(value)} onChange={(event) => updateProfile("employmentTypes", event.target.checked ? [...profile.employmentTypes, value] : profile.employmentTypes.filter((item) => item !== value))} /><span>{label}</span></label>)}</div></div>
                  <div className="field-wrap span-2"><label className="preference-toggle"><input type="checkbox" checked={profile.remote} onChange={(event) => updateProfile("remote", event.target.checked)} /><span><strong>Prefer remote work</strong><small>Use remote preference in job matching when source data provides work mode.</small></span></label></div>

                  <div className="field-wrap"><label htmlFor="salary">Minimum salary</label><input id="salary" type="number" min="0" className="field" value={profile.salaryMin} onChange={(event) => updateProfile("salaryMin", Math.max(0, Number(event.target.value)))} /></div>
                  <div className="field-wrap"><label htmlFor="currency">Salary currency</label><select id="currency" className="field" value={profile.salaryCurrency} onChange={(event) => updateProfile("salaryCurrency", event.target.value)}><option value="INR">INR — Indian rupee</option><option value="USD">USD — US dollar</option><option value="EUR">EUR — Euro</option><option value="GBP">GBP — Pound sterling</option><option value="CAD">CAD — Canadian dollar</option></select></div>
                  <div className="field-wrap span-2"><label htmlFor="skills">Skills</label><textarea id="skills" className="field" value={profile.skills.join(", ")} onChange={(event) => updateProfile("skills", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /><span className="field-help">Separate skills with commas. These are used for matching and form-field mapping.</span></div>
                  <div className="field-wrap span-2"><label htmlFor="keywords">Search keywords</label><input id="keywords" className="field" value={profile.keywords.join(", ")} onChange={(event) => updateProfile("keywords", event.target.value.split(",").map((item) => item.trim()).filter(Boolean))} /></div>
                  <div className="field-wrap span-2"><label htmlFor="summary">Professional summary</label><textarea id="summary" className="field" value={profile.summary} onChange={(event) => updateProfile("summary", event.target.value)} /></div>
                  <div className="field-wrap"><label htmlFor="linkedin">LinkedIn URL</label><input id="linkedin" className="field" value={profile.linkedinUrl} onChange={(event) => updateProfile("linkedinUrl", event.target.value)} /></div>
                  <div className="field-wrap"><label htmlFor="portfolio">Portfolio URL</label><input id="portfolio" className="field" value={profile.portfolioUrl} onChange={(event) => updateProfile("portfolioUrl", event.target.value)} /></div>
                  <div className="field-wrap span-2"><label htmlFor="resume-path">Resume path in worker storage (optional)</label><input id="resume-path" className="field" value={profile.resumePath} onChange={(event) => updateProfile("resumePath", event.target.value)} placeholder="candidate-demo.pdf" /><span className="field-help">This must be a file already mounted inside RESUME_STORAGE_DIR on the worker. A browser upload is not implemented in this demo UI.</span></div>
                </div>
                <div className="form-footer"><span className="field-help"><ShieldCheck size={13} style={{ display: "inline", verticalAlign: "middle", marginRight: 5 }} />Demo details stay in browser state.</span><button className="primary-button" type="submit"><Save size={15} /> Save profile</button></div>
              </form>
              <aside className="grid">
                <div className="profile-summary"><div className="avatar avatar-lg">{initials(profile.fullName)}</div><h2>{profile.fullName || "Your name"}</h2><p>{profile.jobTitle} · {profile.experienceYears} years experience<br />{profile.location}</p><div className="profile-summary-tags">{profile.skills.slice(0, 5).map((skill) => <span key={skill}>{skill}</span>)}{profile.skills.length > 5 && <span>+{profile.skills.length - 5}</span>}</div><div className="summary-divider" /><div className="summary-stat"><span>Profile completion</span><strong>{profile.fullName && profile.email && profile.jobTitle && profile.skills.length ? "Ready to test" : "Needs details"}</strong></div><div className="summary-stat"><span>Submission mode</span><strong>Review only</strong></div><div className="summary-stat"><span>Candidate ID</span><strong>{profile.userId}</strong></div></div>
                <section className="panel info-card"><h2 className="info-heading"><FileText size={16} color="#4176df" /> Before real applications</h2><div className="info-row"><div className="info-row-icon"><CheckCircle2 size={15} /></div><div className="info-row-copy"><strong>Verify every candidate field</strong><span>Do not use these synthetic details for real applications.</span></div></div><div className="info-row"><div className="info-row-icon"><Link2 size={15} /></div><div className="info-row-copy"><strong>Connect a real resume</strong><span>Place an approved resume file in the worker's private storage directory.</span></div></div><div className="info-row"><div className="info-row-icon"><ShieldCheck size={15} /></div><div className="info-row-copy"><strong>Keep submission review enabled</strong><span>CAPTCHA, consent, and uncertain submission states must be handled by the user.</span></div></div></section>
              </aside>
            </div>
          )}

          {view === "settings" && (
            <div className="grid settings-grid">
              <section className="panel">
                <div className="panel-header"><div><h2 className="panel-title">Agent connection</h2><p className="panel-subtitle">Server-side connection to the NestJS worker</p></div><Server size={17} color="#6d87b2" /></div>
                <div className="panel-body">
                  <div className="connection-state"><span className={"status-dot " + statusClass} /><span><strong>{statusText}</strong>{health?.service ? " · " + health.service : ""}</span></div>
                  <div className="settings-row"><div><strong>Worker API</strong><p>Configured on the web server using NVOID_AGENT_URL.</p></div><span className="tag">{agentState === "online" ? "Reachable" : agentState === "checking" ? "Checking" : "Unavailable"}</span></div>
                  <div className="settings-row"><div><strong>Private API key</strong><p>NVOID_AGENT_API_KEY is sent only by server-side route handlers and is never embedded in browser JavaScript.</p></div><span className="tag"><ShieldCheck size={12} /> Server-side</span></div>
                  <div className="settings-row"><div><strong>MCP sources connected</strong><p>Enabled source connectors reported by the worker health endpoint.</p></div><strong>{connectedSources}/{health?.mcp?.configured ?? 0}</strong></div>
                  <button className="secondary-button full-width" style={{ marginTop: 15 }} onClick={refreshWorkspace} disabled={busy !== null}><RefreshCw size={14} className={busy === "refresh" ? "spin" : ""} /> Test connection</button>
                </div>
              </section>
              <section className="panel">
                <div className="panel-header"><div><h2 className="panel-title">Source and execution safeguards</h2><p className="panel-subtitle">Select where test searches are sent</p></div><ShieldCheck size={17} color="#168765" /></div>
                <div className="panel-body">
                  <div className="field-wrap"><label>Live job source</label><div className="settings-row"><div><strong>Jobicy and Remote OK</strong><p>Queries live remote listings by candidate role, then filters by supported geographic eligibility where the provider reports it.</p></div><span className="tag">2 live feeds</span></div><span className="field-help">Both feeds preserve their original listing URLs. Some listings do not provide a direct employer application URL, so those remain listing-only. Naukri and LinkedIn are still disabled until real authorized connectors are configured.</span></div>
                  <div className="settings-row"><div><strong>Auto-submit</strong><p>This interface forces autoSubmit=false for every run. Review tasks and test the form workflow before enabling any authorized real-world submissions through an appropriate backend-controlled flow.</p></div><span className="toggle-locked">OFF · LOCKED</span></div>
                  <div className="settings-row"><div><strong>Backend sync</strong><p>Disabled for this demo profile so synthetic data is not sent to your Jobkar backend.</p></div><span className="toggle-locked">OFF · DEMO</span></div>
                  <div className="settings-row"><div><strong>Candidate persistence</strong><p>Profile edits currently live in browser state and reset when the page reloads. Production persistence requires authenticated user APIs.</p></div><span className="tag">UI demo</span></div>
                </div>
              </section>
              <section className="panel">
                <div className="panel-header"><div><h2 className="panel-title">Test checklist</h2><p className="panel-subtitle">Validate the end-to-end UI and worker connection</p></div><ListChecks size={17} color="#6d87b2" /></div>
                <div className="panel-body"><PipelineSteps hasJobs={jobs.length > 0} hasTasks={tasks.length > 0} hasSource={connectedSources > 0} /><div style={{ marginTop: 14 }}><button className="primary-button full-width" onClick={runAgent} disabled={busy !== null || agentState === "offline"}>{busy === "run" ? <LoaderCircle size={15} className="spin" /> : <Zap size={15} />} Run safe review workflow</button></div></div>
              </section>
              <section className="panel info-card"><h2 className="info-heading"><CircleHelp size={16} color="#4176df" /> Environment variables</h2><p className="field-help" style={{ fontSize: 11, marginBottom: 13 }}>Set these on the Next.js server, not as NEXT_PUBLIC variables.</p><div className="code-panel"><code>NVOID_AGENT_URL=http://127.0.0.1:3100</code><code>NVOID_AGENT_API_KEY=your-private-agent-key</code></div><div className="field-help" style={{ marginTop: 11 }}>The key must match AGENT_API_KEY in the agent worker. In Docker, use the worker's internal service hostname instead of 127.0.0.1.</div></section>
            </div>
          )}

          <div className="footer-note"><ShieldCheck size={13} /> Nvoid demo workspace · Private server-to-server connection · No real applications submitted by this UI</div>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ label, value, foot, icon: Icon, tone = "blue" }: { label: string; value: number; foot: string; icon: LucideIcon; tone?: "blue" | "purple" | "amber" }) {
  return <article className="metric-card"><div className="metric-top"><span className="metric-label">{label}</span><span className={"metric-icon metric-icon-" + tone}><Icon size={16} /></span></div><div className="metric-value">{value.toLocaleString()}</div><div className="metric-foot"><span className="metric-muted">{foot}</span></div></article>;
}

function JobCard({ job }: { job: Job }) {
  const demo = job.source === "demo" || job.demo === true;
  const match = Number.isFinite(job.matchScore) ? Math.round(job.matchScore) : 0;
  const dest = job.jobUrl || job.applicationUrl;
  const sourceLabel = job.source === "jobicy" ? "Jobicy · remote feed" : job.source === "remoteok" ? "Remote OK · remote feed" : job.source || "Connected job source";
  return <article className="job-card">
    <div className="job-card-top">
      <div className="company-mark">{(job.company || job.title || "N").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase()}</div>
      <div className="job-main"><h3 className="job-title">{job.title}</h3><div className="job-company">{job.company || "Company not listed"}</div><div className="job-location"><span><MapPin size={12} />{job.location || job.country || "Location not listed"}</span>{job.country && job.location && job.country !== job.location && <span><Globe2 size={12} />{job.country}</span>}</div></div>
      <span className="match-pill"><Target size={12} />{match}% fit</span>
    </div>
    <div className="job-meta">
      {job.employmentType && <span className="tag"><Briefcase size={11} />{job.employmentType}</span>}
      {job.workMode && <span className="tag"><Globe2 size={11} />{job.workMode}</span>}
      {job.salaryMin !== undefined || job.salaryMax !== undefined ? <span className="tag">{money(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span> : <span className="tag">Salary not listed</span>}
      {demo && <span className="tag source-demo">Synthetic demo listing</span>}
    </div>
    {job.matchReasons && job.matchReasons.length > 0 && <p className="job-reasons">{job.matchReasons.slice(0, 2).join(" · ")}</p>}
    <div className="job-card-footer"><span className="source-text">Source: {sourceLabel}</span>{dest ? <a className="text-link" href={dest} target="_blank" rel="noreferrer">{job.source === "jobicy" ? "Open Jobicy listing" : job.source === "remoteok" ? "Open Remote OK listing" : "View listing"} <ExternalLink size={12} /></a> : <span className="source-text">No external URL</span>}</div>{(job.source === "jobicy" || job.source === "remoteok") && <p className="field-help">Open the original provider listing to review the employer's instructions. Automated application tasks are queued only when a direct application URL is supplied by the source.</p>}
  </article>;
}

function EmptyState({ icon: Icon, title, description, buttonText, onAction, loading = false }: { icon: LucideIcon; title: string; description: string; buttonText: string; onAction: () => void; loading?: boolean }) {
  return <div className="empty-state"><div className="empty-icon"><Icon size={22} /></div><h3>{title}</h3><p>{description}</p><button className="primary-button" onClick={onAction} disabled={loading}>{loading ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />}{buttonText}</button></div>;
}

function PipelineSteps({ hasJobs, hasTasks, hasSource }: { hasJobs: boolean; hasTasks: boolean; hasSource: boolean }) {
  const steps = [
    { label: "Connect job sources", description: hasSource ? "The worker reports at least one connected MCP source." : "The worker reports at least one enabled live job source.", done: hasSource },
    { label: "Discover and match jobs", description: hasJobs ? "Search results are available in this workspace." : "Search listings and rank them against your candidate profile.", done: hasJobs },
    { label: "Queue application tasks", description: hasTasks ? "Task records are available from the Redis-backed worker queue." : "Run the agent to enqueue eligible jobs in review-only mode.", done: hasTasks },
    { label: "Verify the outcome", description: "Check the task result. A queued task is not proof that an application was submitted.", done: false }
  ];
  return <div className="step-list">{steps.map((step, index) => <div className={"step" + (step.done ? " done" : "")} key={step.label}><div className="step-index">{step.done ? <Check size={14} /> : index + 1}</div><div className="step-copy"><strong>{step.label}</strong><span>{step.description}</span></div></div>)}</div>;
}

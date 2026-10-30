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

type View = "overview" | "jobs" | "research" | "applications" | "profile" | "connections";
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
  postedAt?: string;
  experience?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  matchScore: number;
  matchReasons?: string[];
  demo?: boolean;
  raw?: Record<string, unknown>;
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
type McpSourceStatus = {
  id: string;
  name: string;
  enabled: boolean;
  transport?: string;
  connected: boolean;
  toolCount?: number;
  error?: string;
};
type McpTool = {
  name: string;
  description?: string;
  inputSchema?: unknown;
  outputSchema?: unknown;
  annotations?: { title?: string; readOnlyHint?: boolean; destructiveHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
};
type McpToolServer = { serverId: string; serverName: string; tools: McpTool[] };
type SearchSourceReport = { serverId: string; provider?: string; mode?: string; queryCount?: number; requestsMade?: number; rawIndexedResults?: number; uniqueRoleLocationUrls?: number; linkedJobUrlsDiscovered?: number; publicJobPagesFetched?: number; structuredJobPages?: number; metadataOnlyListings?: number; matchedJobs?: number; returnedJobs?: number; targetCount?: number; reachedRequestedLimit?: boolean; moreSearchResultsAvailable?: boolean; failedSearchRequests?: number; rejectedUrlResults?: number; rejectedRoleResults?: number; rejectedLocationResults?: number; opportunityTypes?: Record<string, number>; truncated?: boolean };
type JobSourceResult = { serverId: string; tool?: string; found: number; error?: string; report?: SearchSourceReport };
type ResearchToolOption = { serverId: string; serverName: string; name: string; description?: string; inputSchema?: unknown; safety?: string };
type ResearchCatalog = { connectedServers: number; configuredServers: number; servers: McpSourceStatus[]; availableReadOnlyTools: ResearchToolOption[]; availableReadOnlyToolCount: number };
type ResearchConnectorReport = { serverId: string; serverName: string; enabled: boolean; connected: boolean; selected: boolean; connectionError?: string; discoveredTools: number; readOnlyTools: number; callsSucceeded: number; callsFailed: number; recordsReturned: number };
type ResearchCall = { serverId: string; serverName: string; toolName: string; reason: string; status: "success" | "failed"; durationMs: number; recordsReturned: number; providerReport?: Record<string, unknown>; error?: string };
type ResearchRecord = { id: string; serverId: string; serverName: string; toolName: string; title?: string; url?: string; data: Record<string, unknown> };
type ResearchResult = { query: string; generatedAt: string; planner: "llm" | "heuristic"; report: { configuredServers: number; connectedServers: number; selectedServers: number; selectedConnectedServers: number; toolsDiscovered: number; readOnlyToolsDiscovered: number; plannedCalls: number; successfulCalls: number; failedCalls: number; rawRecords: number; uniqueRecords: number; duplicatesRemoved: number; maxRecords: number; truncated: boolean; perConnector: ResearchConnectorReport[] }; calls: ResearchCall[]; records: ResearchRecord[]; warnings: string[] };

const initialProfile: CandidateProfile = {
  userId: "nvoid-demo-candidate-001",
  fullName: "Aarav Sharma",
  firstName: "Aarav",
  lastName: "Sharma",
  email: "aarav.demo@example.com",
  phone: "+91 90000 12345",
  jobTitle: "",
  location: "",
  countries: [],
  skills: [],
  keywords: [],
  experienceYears: 3,
  salaryMin: 1200000,
  salaryCurrency: "INR",
  employmentTypes: ["full-time"],
  remote: false,
  summary: "Demo candidate profile for testing the Nvoid discovery and application workflow. Replace these values with accurate candidate details before any real application.",
  linkedinUrl: "https://www.linkedin.com/in/demo-candidate/",
  portfolioUrl: "https://example.com/portfolio",
  resumePath: ""
};

const navItems: Array<{ id: View; label: string; icon: LucideIcon }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "jobs", label: "Find jobs", icon: Search },
  { id: "research", label: "Research anything", icon: Globe2 },
  { id: "applications", label: "Applications", icon: ClipboardList },
  { id: "profile", label: "Candidate profile", icon: UserRound },
  { id: "connections", label: "Connections", icon: Server }
];

const pageInfo: Record<View, { eyebrow: string; title: string; description: string }> = {
  overview: { eyebrow: "Your job search workspace", title: "Overview", description: "One workspace to discover opportunities, compare your fit, and track every agent task." },
  jobs: { eyebrow: "Federated opportunity discovery", title: "Find your next role", description: "One search fans out across connected MCP sources, public job feeds, Google-dork discovery, company career pages and relevant public recruitment notices." },
  research: { eyebrow: "Live federated research", title: "Research anything", description: "Plan a query across connected read-only MCP tools, search the public web, crawl accessible pages, and inspect the real records returned by every source." },
  applications: { eyebrow: "Execution history", title: "Application tracker", description: "Review queued tasks, completion states, and jobs that need your attention." },
  profile: { eyebrow: "Candidate intelligence", title: "Your candidate profile", description: "Keep the test profile accurate so the agent can search and match against the right criteria." },
  connections: { eyebrow: "MCP infrastructure", title: "Connections", description: "Inspect every configured MCP connector, its live connection state, and the tools and skills discovered from each connected server." }
};

function connectorSetupHint(source: McpSourceStatus): string | undefined {
  const hints: Record<string, string> = {
    "apify-boards": "Add APIFY_API_TOKEN to the agent worker's .env to activate Naukri, LinkedIn Jobs, Indeed, and Glassdoor through the third-party Apify actor. Per-result/platform charges may apply.",
    "apify-apna": "Add APIFY_API_TOKEN to the agent worker's .env to activate the Apna public-job connector. Third-party usage charges may apply.",
    adzuna: "Add ADZUNA_APP_ID and ADZUNA_APP_KEY to the agent worker's .env.",
    jooble: "Add JOOBLE_API_KEY to the agent worker's .env. Jooble API keys can be region-specific.",
    "serper-search": "Add SERPER_API_KEY to the worker .env. One search expands into Google-style role, location, job-board, ATS, company-career and government-recruitment queries, then crawls public result pages. API credits are used per successful search request.",
    greenhouse: "Set GREENHOUSE_BOARDS to comma-separated company board slugs in the worker .env. Nvoid searches those public Greenhouse career boards.",
    lever: "Set LEVER_SITES to comma-separated company site slugs in the worker .env. Nvoid searches those public Lever career boards.",
    ashby: "Set ASHBY_BOARDS to comma-separated company board slugs in the worker .env. Nvoid searches those public Ashby career boards.",
    naukri: "Set NAUKRI_MCP_URL and NAUKRI_MCP_TOKEN to an authorized Naukri MCP endpoint. It auto-enables after restart and the worker discovers the search tool from the MCP tool catalogue.",
    indeed: "Set INDEED_MCP_URL and INDEED_MCP_TOKEN to an authorized Indeed MCP endpoint. It auto-enables after restart and the worker discovers the search tool from the MCP tool catalogue.",
    linkedin: "Set LINKEDIN_MCP_URL and LINKEDIN_MCP_TOKEN to an authorized LinkedIn Jobs MCP endpoint. It auto-enables after restart and the worker discovers the search tool from the MCP tool catalogue.",
    glassdoor: "Set GLASSDOOR_MCP_URL and GLASSDOOR_MCP_TOKEN to an authorized Glassdoor MCP endpoint. It auto-enables after restart and the worker discovers the search tool from the MCP tool catalogue.",
    apna: "Set APNA_MCP_URL and APNA_MCP_TOKEN to an authorized Apna MCP endpoint. It auto-enables after restart and the worker discovers the search tool from the MCP tool catalogue.",
    demo: "Synthetic test listings only. Kept disabled in the normal runtime configuration."
  };
  return hints[source.id] || "Enable this source in config/mcp-servers.json and configure any required credentials or endpoint.";
}

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
  const [sourceStatuses, setSourceStatuses] = useState<McpSourceStatus[]>([]);
  const [mcpToolServers, setMcpToolServers] = useState<McpToolServer[]>([]);
  const [toolCatalogError, setToolCatalogError] = useState("");
  const [searchSourceResults, setSearchSourceResults] = useState<JobSourceResult[]>([]);
  const [searchReport, setSearchReport] = useState<SearchSourceReport[]>([]);
  const [sourceRefreshError, setSourceRefreshError] = useState("");
  const [agentState, setAgentState] = useState<"checking" | "online" | "offline">("checking");
  const [busy, setBusy] = useState<"search" | "run" | "research" | "refresh" | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [showDemoBanner, setShowDemoBanner] = useState(true);
  const [minMatchScore, setMinMatchScore] = useState(55);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lastSearch, setLastSearch] = useState<string | null>(null);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsPageSize, setJobsPageSize] = useState(12);
  const [taskRefreshError, setTaskRefreshError] = useState("");
  const [researchQuery, setResearchQuery] = useState("");
  const [researchCatalog, setResearchCatalog] = useState<ResearchCatalog | null>(null);
  const [researchServerIds, setResearchServerIds] = useState<string[] | null>(null);
  const [researchMaxRecords, setResearchMaxRecords] = useState(100);
  const [researchMaxTools, setResearchMaxTools] = useState(20);
  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);

  const connectedSources = health?.mcp?.connected ?? 0;
  const matchedJobs = useMemo(() => jobs.filter((job) => job.matchScore >= minMatchScore).length, [jobs, minMatchScore]);
  const appliedTasks = useMemo(() => tasks.filter((task) => taskStatus(task) === "applied").length, [tasks]);
  const needsActionTasks = useMemo(() => tasks.filter((task) => taskStatus(task) === "needs_user_action" || taskStatus(task) === "failed").length, [tasks]);
  const queuedTasks = useMemo(() => tasks.filter((task) => ["waiting", "active", "delayed"].includes(taskStatus(task))).length, [tasks]);
  const currentInfo = pageInfo[view];
  const totalJobPages = Math.max(1, Math.ceil(jobs.length / jobsPageSize));
  const visibleJobPages = Array.from(
    { length: Math.min(5, totalJobPages) },
    (_, index) => Math.max(1, Math.min(jobsPage - 2, totalJobPages - 4)) + index,
  );
  const paginatedJobs = useMemo(
    () => jobs.slice((jobsPage - 1) * jobsPageSize, jobsPage * jobsPageSize),
    [jobs, jobsPage, jobsPageSize],
  );
  const discoveredToolCount = mcpToolServers.reduce((total, server) => total + server.tools.length, 0);

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

  const loadSources = useCallback(async () => {
    try {
      const result = await readJson(await fetch("/api/agent/sources", { cache: "no-store" }));
      const servers = Array.isArray(result.servers) ? result.servers as McpSourceStatus[] : [];
      setSourceStatuses(servers);
      setSourceRefreshError("");
    } catch (error) {
      setSourceRefreshError(error instanceof Error ? error.message : "Could not load connector statuses.");
      setSourceStatuses([]);
    }
  }, []);

  const loadToolCatalog = useCallback(async () => {
    try {
      const result = await readJson(await fetch("/api/agent/tools", { cache: "no-store" }));
      const servers = Array.isArray(result.servers) ? result.servers as McpToolServer[] : [];
      setMcpToolServers(servers);
      setToolCatalogError("");
      return servers;
    } catch (error) {
      setToolCatalogError(error instanceof Error ? error.message : "Could not load MCP tool inventory.");
      setMcpToolServers([]);
      return [];
    }
  }, []);

  const loadResearchTools = useCallback(async () => {
    try {
      const result = await readJson(await fetch("/api/research/tools", { cache: "no-store" }));
      const catalog = result as ResearchCatalog;
      setResearchCatalog(catalog);
      setResearchServerIds((current) => current === null
        ? catalog.availableReadOnlyTools.map((tool) => tool.serverId).filter((id, index, all) => all.indexOf(id) === index)
        : current.filter((id) => catalog.availableReadOnlyTools.some((tool) => tool.serverId === id)));
      return catalog;
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Could not load connected research tools." });
      throw error;
    }
  }, []);

  const selectedResearchServerIds = researchServerIds ?? [...new Set(researchCatalog?.availableReadOnlyTools.map((tool) => tool.serverId) ?? [])];
  const researchSourceOptions = useMemo(() => (researchCatalog?.servers ?? [])
    .filter((server) => server.connected && researchCatalog?.availableReadOnlyTools.some((tool) => tool.serverId === server.id))
    .map((server) => ({
      ...server,
      tools: researchCatalog?.availableReadOnlyTools.filter((tool) => tool.serverId === server.id) ?? [],
    })), [researchCatalog]);

  const runResearch = async (event?: FormEvent) => {
    event?.preventDefault();
    if (researchQuery.trim().length < 3) {
      setNotice({ type: "error", message: "Enter a research question of at least three characters." });
      return;
    }
    const selectedIds = selectedResearchServerIds;
    if (selectedIds.length === 0) {
      setNotice({ type: "error", message: "Select at least one connected source with read-only research tools." });
      return;
    }
    setBusy("research");
    setNotice(null);
    try {
      const result = await readJson(await fetch("/api/research/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: researchQuery.trim(),
          serverIds: selectedIds,
          maxRecords: researchMaxRecords,
          maxTools: researchMaxTools,
        }),
      }));
      setResearchResult(result as ResearchResult);
      const report = result.report as ResearchResult["report"];
      setNotice({
        type: report.successfulCalls > 0 ? "success" : "info",
        message: "Research execution finished: " + report.uniqueRecords + " unique record(s) from " + report.successfulCalls + " successful tool call(s), with " + report.failedCalls + " failed call(s).",
      });
    } catch (error) {
      setNotice({ type: "error", message: error instanceof Error ? error.message : "Research execution failed." });
    } finally {
      setBusy(null);
    }
  };

  const refreshWorkspace = useCallback(async () => {
    setBusy("refresh");
    await Promise.all([loadHealth(), loadTasks(), loadSources(), loadToolCatalog()]);
    setBusy(null);
  }, [loadHealth, loadTasks, loadSources, loadToolCatalog]);

  useEffect(() => {
    void loadHealth();
    void loadTasks();
    void loadSources();
    void loadToolCatalog();
  }, [loadHealth, loadTasks, loadSources, loadToolCatalog]);

  const updateProfile = <K extends keyof CandidateProfile,>(key: K, value: CandidateProfile[K]) => {
    setProfile((current) => ({ ...current, [key]: value }));
  };

  const searchJobs = async (event?: FormEvent) => {
    event?.preventDefault();
    if (!profile.jobTitle.trim() || !profile.location.trim()) {
      setView("jobs");
      setNotice({ type: "error", message: "Enter both a target job title and a preferred city, region, or country before searching. Use Worldwide only for a global search." });
      return;
    }
    setJobsPage(1);
    setBusy("search");
    setNotice(null);
    try {
      const result = await readJson(await fetch("/api/agent/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          profile: { ...profile },
          limit: 1000,
          syncToBackend: false
        })
      }));
      setJobs(Array.isArray(result.jobs) ? result.jobs as Job[] : []);
      setSearchSourceResults(Array.isArray(result.sources) ? result.sources as JobSourceResult[] : []);
      setSearchReport(Array.isArray(result.searchReport) ? result.searchReport as SearchSourceReport[] : Array.isArray(result.sources) ? (result.sources as JobSourceResult[]).flatMap((source) => source.report ? [source.report] : []) : []);
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
    if (!profile.jobTitle.trim() || !profile.location.trim()) {
      setView("jobs");
      setNotice({ type: "error", message: "Enter both a target job title and a preferred location before running the agent." });
      return;
    }
    setBusy("run");
    setNotice(null);
    try {
      const result = await readJson(await fetch("/api/agent/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          userId: profile.userId,
          profile: { ...profile },
          searchLimit: 1000,
          applyLimit: 10,
          minMatchScore,
          autoSubmit: false,
          syncToBackend: false
        })
      }));
      if (Array.isArray(result.search?.jobs)) setJobs(result.search.jobs as Job[]);
      setSearchSourceResults(Array.isArray(result.search?.sources) ? result.search.sources as JobSourceResult[] : []);
      setSearchReport(Array.isArray(result.search?.searchReport) ? result.search.searchReport as SearchSourceReport[] : Array.isArray(result.search?.sources) ? (result.search.sources as JobSourceResult[]).flatMap((source) => source.report ? [source.report] : []) : []);
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
    if (next === "research" && !researchCatalog) void loadResearchTools().catch(() => undefined);
    if (next === "connections") void Promise.all([loadSources(), loadToolCatalog()]);
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
              {view === "research" ? (
                <button className="secondary-button" onClick={() => void loadResearchTools()} disabled={busy !== null}><RefreshCw size={15} /> Refresh tools</button>
              ) : view === "connections" ? (
                <button className="secondary-button" onClick={() => void Promise.all([loadSources(), loadToolCatalog()])} disabled={busy !== null}><RefreshCw size={15} /> Refresh connections</button>
              ) : view === "jobs" ? null : (
                <>
                  <button className="secondary-button" onClick={() => goTo("jobs")} disabled={busy !== null}><Search size={15} /> Find jobs</button>
                  <button className="primary-button" onClick={runAgent} disabled={busy !== null || agentState === "offline"}>{busy === "run" ? <LoaderCircle size={15} className="spin" /> : <Zap size={15} />} Run agent <ArrowRight size={14} /></button>
                </>
              )}
            </div>
          </div>

          {showDemoBanner && <div className="demo-banner"><ShieldCheck size={17} /><div className="demo-banner-copy"><strong>Live job search is enabled.</strong> The candidate profile still contains fictional test details. Searches fan out across connected MCP sources and public feeds, plus Serper's Google-style dork searches for job boards, ATS boards, company career pages and public recruitment notices. Naukri, LinkedIn, Indeed, Glassdoor and Apna require an authorized direct MCP endpoint or the optional Apify connector. Agent runs remain review-only and do not sync to the Jobkar backend or submit applications.</div><button className="demo-banner-close" aria-label="Dismiss notice" onClick={() => setShowDemoBanner(false)}><X size={15} /></button></div>}
          {notice && <div className={"notice " + notice.type}><div>{notice.type === "error" ? <CircleAlert size={16} /> : notice.type === "success" ? <CheckCircle2 size={16} /> : <Activity size={16} />}</div><div>{notice.message}</div><button className="demo-banner-close" aria-label="Dismiss message" onClick={() => setNotice(null)}><X size={14} /></button></div>}
          {view === "research" && (
            <div className="grid" style={{ gap: 16 }}>
              <section className="panel">
                <div className="panel-header">
                  <div><h2 className="panel-title">Live research query</h2><p className="panel-subtitle">Every metric and record below comes from tool calls executed for this query. No synthetic report data is inserted.</p></div>
                  <span className="tag">{researchCatalog?.availableReadOnlyToolCount ?? 0} read-only tools</span>
                </div>
                <div className="panel-body">
                  <form className="grid" style={{ gap: 14 }} onSubmit={runResearch}>
                    <div className="field-wrap">
                      <label htmlFor="research-query">What do you want to research?</label>
                      <textarea id="research-query" className="field" rows={4} value={researchQuery} onChange={(event) => setResearchQuery(event.target.value)} placeholder="e.g. Find Indian SaaS companies hiring backend engineers, identify their careers pages, open roles, decision makers and public contact channels." />
                      <span className="field-help">Use natural language or include Google operators such as site:, inurl:, intitle:, quoted phrases and OR. The planner may expand the query into complementary searches when an LLM is configured.</span>
                    </div>
                    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
                      <div className="field-wrap"><label htmlFor="research-record-limit">Maximum unique records</label><select id="research-record-limit" className="field" value={researchMaxRecords} onChange={(event) => setResearchMaxRecords(Number(event.target.value))}><option value={25}>25 records</option><option value={100}>100 records</option><option value={250}>250 records</option><option value={500}>500 records</option><option value={1000}>1,000 records</option></select></div>
                      <div className="field-wrap"><label htmlFor="research-tool-limit">Maximum MCP tool calls</label><select id="research-tool-limit" className="field" value={researchMaxTools} onChange={(event) => setResearchMaxTools(Number(event.target.value))}><option value={5}>5 calls</option><option value={10}>10 calls</option><option value={20}>20 calls</option><option value={30}>30 calls</option><option value={40}>40 calls</option></select></div>
                      <div className="field-wrap"><label>&nbsp;</label><button className="primary-button full-width" type="submit" disabled={busy !== null || researchQuery.trim().length < 3 || selectedResearchServerIds.length === 0}>{busy === "research" ? <LoaderCircle size={15} className="spin" /> : <Globe2 size={15} />} {busy === "research" ? "Researching live sources…" : "Run live research"} <ArrowRight size={14} /></button></div>
                    </div>
                  </form>
                  <div className="settings-row" style={{ marginTop: 18, paddingTop: 15 }}>
                    <div><strong>Connected read-only sources</strong><p>Select the actual connected MCP servers whose read tools should be executed. Mutation and destructive tools are excluded by the worker.</p></div>
                    <span className="tag">{selectedResearchServerIds.length} selected</span>
                  </div>
                  {!researchCatalog && <p className="field-help">Load the connected tool catalogue to see available research sources.</p>}
                  {researchCatalog && researchSourceOptions.length === 0 && <div className="notice info" style={{ marginTop: 12 }}>No connected MCP server currently exposes a tool that can be classified as read-only research. Check the worker's connector inventory and tool schemas.</div>}
                  <div className="grid" style={{ gap: 8, marginTop: 10 }}>
                    {researchSourceOptions.map((source) => {
                      const checked = selectedResearchServerIds.includes(source.id);
                      return <label key={source.id} className="settings-row" style={{ alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
                        <input type="checkbox" checked={checked} onChange={() => setResearchServerIds((current) => {
                          const selected = current ?? researchSourceOptions.map((item) => item.id);
                          return selected.includes(source.id) ? selected.filter((id) => id !== source.id) : [...selected, source.id];
                        })} />
                        <span style={{ flex: 1, minWidth: 0 }}><strong>{source.name}</strong><p>{source.id} · {source.tools.length} read-only tool(s) · {source.tools.map((tool) => tool.name).join(", ")}</p></span>
                        <span className="tag">Connected</span>
                      </label>;
                    })}
                  </div>
                </div>
              </section>

              {researchResult && (
                <>
                  <section className="panel">
                    <div className="panel-header"><div><h2 className="panel-title">Execution report</h2><p className="panel-subtitle">{researchResult.query} · {new Date(researchResult.generatedAt).toLocaleString()} · planner: {researchResult.planner}</p></div><span className="tag">{researchResult.report.uniqueRecords.toLocaleString()} unique records</span></div>
                    <div className="panel-body">
                      <div className="grid metric-grid">
                        <MetricCard label="Connected sources" value={researchResult.report.connectedServers} foot={researchResult.report.selectedConnectedServers + " selected · " + researchResult.report.configuredServers + " configured"} icon={Server} />
                        <MetricCard label="Read-only tools" value={researchResult.report.readOnlyToolsDiscovered} foot={researchResult.report.toolsDiscovered + " tools discovered"} icon={Code2} />
                        <MetricCard label="Successful calls" value={researchResult.report.successfulCalls} foot={researchResult.report.failedCalls + " failed · " + researchResult.report.plannedCalls + " planned"} icon={Activity} />
                        <MetricCard label="Unique records" value={researchResult.report.uniqueRecords} foot={researchResult.report.rawRecords + " raw · " + researchResult.report.duplicatesRemoved + " duplicates removed"} icon={Database} />
                      </div>
                      <div className="field-help" style={{ marginTop: 12 }}>{researchResult.report.truncated ? "The requested unique-record cap was reached. Additional provider records may exist." : "Record cap: " + researchResult.report.maxRecords + ". Results shown are only records actually returned by successful connector calls."}</div>
                      {researchResult.warnings.map((warning, index) => <div key={index} className="notice info" style={{ marginTop: 8 }}><CircleAlert size={14} />{warning}</div>)}
                    </div>
                  </section>

                  <section className="panel">
                    <div className="panel-header"><div><h2 className="panel-title">Connector coverage</h2><p className="panel-subtitle">Configured sources are included even when they failed to connect or were unable to return data.</p></div></div>
                    <div className="panel-body"><div className="grid" style={{ gap: 8 }}>
                      {researchResult.report.perConnector.map((source) => <div key={source.serverId} className="settings-row" style={{ alignItems: "flex-start", gap: 10 }}>
                        <span className="status-dot" style={{ marginTop: 5, flexShrink: 0, background: source.connected ? "#16a36a" : source.enabled ? "#dc5252" : "#9aa8ba", boxShadow: "none" }} />
                        <div style={{ flex: 1, minWidth: 0 }}><strong>{source.serverName}</strong><p>{source.serverId} · {source.connected ? source.readOnlyTools + " read-only / " + source.discoveredTools + " discovered tools" : source.enabled ? "Connection failed" : "Inactive"}</p>{source.connectionError && <span className="field-help" style={{ color: "#c43c45" }}>{source.connectionError}</span>}</div>
                        <span className="tag">{source.selected ? "Selected" : "Not selected"} · {source.connected ? "Connected" : source.enabled ? "Failed" : "Inactive"}</span>
                        <span className="tag">{source.callsSucceeded} ok · {source.callsFailed} failed · {source.recordsReturned} records</span>
                      </div>)}
                    </div></div>
                  </section>

                  <section className="panel">
                    <div className="panel-header"><div><h2 className="panel-title">Executed MCP tool calls</h2><p className="panel-subtitle">The worker's actual calls, execution time, output counts and any provider errors.</p></div><span className="tag">{researchResult.calls.length} calls</span></div>
                    <div className="panel-body"><div className="grid" style={{ gap: 9 }}>
                      {researchResult.calls.map((call, index) => <div className="settings-row" key={call.serverId + "/" + call.toolName + "/" + index} style={{ alignItems: "flex-start", gap: 10 }}>
                        <span className="status-dot" style={{ marginTop: 5, flexShrink: 0, background: call.status === "success" ? "#16a36a" : "#dc5252", boxShadow: "none" }} />
                        <div style={{ flex: 1, minWidth: 0 }}><strong>{call.serverName} / {call.toolName}</strong><p>{call.reason} · {call.durationMs.toLocaleString()} ms · {call.recordsReturned} returned</p>{call.error && <span className="field-help" style={{ color: "#c43c45" }}>{call.error}</span>}{call.providerReport && <details style={{ marginTop: 8 }}><summary className="text-link" style={{ cursor: "pointer" }}>View search and crawl diagnostics</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 360, overflow: "auto", fontSize: 11, marginTop: 8 }}>{JSON.stringify(call.providerReport, null, 2)}</pre></details>}</div>
                        <span className="tag">{call.status}</span>
                      </div>)}
                      {researchResult.calls.length === 0 && <p className="field-help">No tool calls were executable for this query. Review planner warnings and tool input schemas.</p>}
                    </div></div>
                  </section>

                  <section className="panel">
                    <div className="panel-header"><div><h2 className="panel-title">Retrieved records</h2><p className="panel-subtitle">Real connector output with source attribution and original URLs where provided by the source.</p></div><span className="tag">{researchResult.records.length.toLocaleString()} records</span></div>
                    <div className="panel-body">
                      {researchResult.records.length === 0 ? <div className="empty-state"><div className="empty-icon"><Database size={22} /></div><h3>No records returned</h3><p>Calls may have failed, returned an empty response or required input arguments that could not safely be inferred. Inspect connector coverage and call diagnostics above.</p></div> : (
                        <div className="grid" style={{ gap: 10 }}>
                          {researchResult.records.map((record) => <article className="job-card" key={record.id}>
                            <div className="job-card-top"><div className="company-mark"><Database size={17} /></div><div className="job-main"><h3 className="job-title">{record.title || String(record.data.name || record.data.subject || record.data.headline || record.data.title || "Research record")}</h3><div className="job-company">{record.serverName} · {record.toolName}</div></div><span className="tag">{record.serverId}</span></div>
                            <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 8, marginTop: 10 }}>
                              {Object.entries(record.data).filter(([key]) => !["description", "content", "body", "text"].includes(key.toLowerCase())).slice(0, 6).map(([key, value]) => <div key={key} className="field-wrap"><span className="field-help">{key}</span><strong style={{ overflowWrap: "anywhere", fontSize: 12 }}>{typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value).slice(0, 220) : JSON.stringify(value).slice(0, 220)}</strong></div>)}
                            </div>
                            <div className="job-card-footer">{record.url && record.url.startsWith("http") ? <a className="text-link" href={record.url} target="_blank" rel="noreferrer">Open source record <ExternalLink size={12} /></a> : <span className="source-text">No source URL supplied</span>}<details><summary className="text-link" style={{ cursor: "pointer" }}>View complete record</summary><pre style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere", maxHeight: 420, overflow: "auto", fontSize: 11, marginTop: 10 }}>{JSON.stringify(record.data, null, 2)}</pre></details></div>
                          </article>)}
                        </div>
                      )}
                    </div>
                  </section>
                </>
              )}
            </div>
          )}

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
                      <button className="secondary-button full-width" style={{ marginTop: 17 }} onClick={() => goTo("connections")}>Connection settings <ArrowRight size={14} /></button>
                    </div>
                  </section>
                </div>
              </div>
            </>
          )}

          {view === "jobs" && (
            <section className="panel">
              <div className="panel-header">
                <div>
                  <h2 className="panel-title">Find jobs across connected sources</h2>
                  <p className="panel-subtitle">Search every connected job-search MCP, public job feed and configured public-web crawler in one run.</p>
                </div>
              </div>
              <div className="panel-body">
                <form className="search-bar job-search-form" onSubmit={searchJobs}>
                  <div className="field-wrap">
                    <label htmlFor="search-role">Job title</label>
                    <input id="search-role" className="field" value={profile.jobTitle} onChange={(event) => updateProfile("jobTitle", event.target.value)} placeholder="e.g. Java Backend Developer" />
                  </div>
                  <div className="field-wrap">
                    <label htmlFor="search-location">Location</label>
                    <input id="search-location" className="field" value={profile.location} onChange={(event) => updateProfile("location", event.target.value)} placeholder="e.g. Bengaluru, India" />
                  </div>
                  <div className="field-wrap">
                    <label>&nbsp;</label>
                    <button className="primary-button full-width" type="submit" disabled={busy !== null}>
                      {busy === "search" ? <LoaderCircle size={15} className="spin" /> : <Search size={15} />}
                      {busy === "search" ? "Searching all sources..." : "Search jobs"}
                    </button>
                  </div>
                </form>
                <p className="job-search-note">Nvoid automatically searches every connected source that exposes a job-search tool. Connector configuration and tool discovery live in the Connections tab.</p>
                {jobs.length > 0 && (
                  <>
                    <div className="job-results-toolbar">
                      <div>
                        <strong>{jobs.length.toLocaleString()} jobs found</strong>
                        <span>{lastSearch ? " · Last searched at " + lastSearch : ""}</span>
                      </div>
                      <label className="page-size-control">
                        <span>Show</span>
                        <select className="field" value={jobsPageSize} onChange={(event) => { setJobsPageSize(Number(event.target.value)); setJobsPage(1); }}>
                          <option value={12}>12 per page</option>
                          <option value={24}>24 per page</option>
                          <option value={48}>48 per page</option>
                        </select>
                      </label>
                    </div>
                    <div className="job-results-grid">
                      {paginatedJobs.map((job) => <JobCard key={job.id} job={job} />)}
                    </div>
                    {totalJobPages > 1 && (
                      <div className="job-pagination" aria-label="Job result pages">
                        <span className="pagination-summary">Showing {((jobsPage - 1) * jobsPageSize) + 1}–{Math.min(jobsPage * jobsPageSize, jobs.length)} of {jobs.length.toLocaleString()}</span>
                        <div className="pagination-controls">
                          <button className="page-button" type="button" onClick={() => setJobsPage((current) => Math.max(1, current - 1))} disabled={jobsPage === 1}>Previous</button>
                          {visibleJobPages.map((pageNumber) => (
                            <button key={pageNumber} className={"page-button" + (jobsPage === pageNumber ? " active" : "")} type="button" onClick={() => setJobsPage(pageNumber)} aria-current={jobsPage === pageNumber ? "page" : undefined}>{pageNumber}</button>
                          ))}
                          <button className="page-button" type="button" onClick={() => setJobsPage((current) => Math.min(totalJobPages, current + 1))} disabled={jobsPage === totalJobPages}>Next</button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {jobs.length === 0 && lastSearch ? (
                  <EmptyState icon={SearchCheck} title="No matching jobs returned" description="The connected providers completed without returning a job that matched this role and location. Review the source coverage below or broaden the location and job-title query." buttonText="Search again" onAction={() => void searchJobs()} loading={busy === "search"} />
                ) : jobs.length === 0 ? (
                  <div className="job-search-empty">
                    <div className="empty-icon"><SearchCheck size={22} /></div>
                    <h3>Search once. Explore every connected source.</h3>
                    <p>Enter a job title and location to collect matching listings from all available MCP job tools and configured crawlers.</p>
                  </div>
                ) : null}
                {(searchSourceResults.length > 0 || searchReport.some((report) => report.serverId === "serper-search")) && (
                  <section className="source-coverage">
                    <div className="source-coverage-heading">
                      <div>
                        <h3>Search coverage</h3>
                        <p>See which connected sources returned listings for this search.</p>
                      </div>
                      <span>{searchSourceResults.filter((source) => !source.error).length} healthy sources</span>
                    </div>
                    {searchSourceResults.length > 0 && (
                      <div className="source-result-grid">
                        {searchSourceResults.map((source) => (
                          <article className="source-result-card" key={source.serverId}>
                            <div className="source-result-top">
                              <span className={"source-result-indicator" + (source.error ? " has-error" : "")} />
                              <strong>{source.provider || source.serverId.replace(/[-_]/g, " ")}</strong>
                              <span className={"source-result-status" + (source.error ? " has-error" : "")}>{source.error ? "Error" : source.found > 0 ? "Results" : "Checked"}</span>
                            </div>
                            <div className="source-result-count">{source.found.toLocaleString()}</div>
                            <div className="source-result-caption">matching listing(s)</div>
                            <div className="source-result-meta">
                              {source.report?.requestsMade ? <span>{source.report.requestsMade} web requests</span> : null}
                              {source.report?.publicJobPagesFetched ? <span>{source.report.publicJobPagesFetched} pages fetched</span> : null}
                              {source.report?.structuredJobPages ? <span>{source.report.structuredJobPages} structured job pages</span> : null}
                              {!source.report?.requestsMade && !source.report?.publicJobPagesFetched && !source.report?.structuredJobPages ? <span>Source checked for this role and location</span> : null}
                            </div>
                            {source.error && <p className="source-result-error">{source.error}</p>}
                          </article>
                        ))}
                      </div>
                    )}
                    {searchReport.some((report) => report.serverId === "serper-search") && (() => {
                      const report = searchReport.find((item) => item.serverId === "serper-search")!;
                      return (
                        <details className="source-crawl-details">
                          <summary>Public web search and crawl details <span>{(report.requestsMade ?? 0).toLocaleString()} requests · {(report.publicJobPagesFetched ?? 0).toLocaleString()} pages fetched</span></summary>
                          <div className="source-crawl-stats">
                            <div><span>Indexed results</span><strong>{(report.rawIndexedResults ?? 0).toLocaleString()}</strong></div>
                            <div><span>Unique job URLs</span><strong>{(report.uniqueRoleLocationUrls ?? 0).toLocaleString()}</strong></div>
                            <div><span>Structured job pages</span><strong>{(report.structuredJobPages ?? 0).toLocaleString()}</strong></div>
                            <div><span>Matching records</span><strong>{(report.matchedJobs ?? 0).toLocaleString()}</strong></div>
                          </div>
                          <p>{report.reachedRequestedLimit ? "The requested record count was reached." : "The requested count was not reached."}{report.failedSearchRequests ? " Failed search requests: " + report.failedSearchRequests + "." : ""}{report.truncated ? " Results were truncated by the configured crawl/result budget." : ""}{report.moreSearchResultsAvailable ? " More indexed results may be available." : ""}</p>
                        </details>
                      );
                    })()}
                  </section>
                )}
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

          {view === "connections" && (
            <div className="grid" style={{ gap: 16 }}>
              <div className="grid metric-grid">
                <MetricCard label="Configured connectors" value={sourceStatuses.length} foot="MCP servers in worker config" icon={Server} />
                <MetricCard label="Connected servers" value={sourceStatuses.filter((source) => source.connected).length} foot={sourceStatuses.filter((source) => source.enabled && !source.connected).length + " enabled but unavailable"} icon={CheckCircle2} tone="purple" />
                <MetricCard label="Discovered tools / skills" value={discoveredToolCount} foot="Tools listed by connected MCP servers" icon={Code2} tone="blue" />
                <MetricCard label="Job-search sources" value={sourceStatuses.filter((source) => source.connected && mcpToolServers.find((entry) => entry.serverId === source.id)?.tools.some((tool) => /job|vacanc|career|search|listing/i.test(tool.name + " " + (tool.description ?? "")))).length} foot="Connected servers exposing job-related tools" icon={Briefcase} tone="amber" />
              </div>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">Nvoid worker connection</h2>
                    <p className="panel-subtitle">Private server-to-server connection from this workspace to the MCP worker.</p>
                  </div>
                  <span className={"tag " + (agentState === "online" ? "source-state-connected" : agentState === "offline" ? "source-state-error" : "")}>{statusText}</span>
                </div>
                <div className="panel-body">
                  <div className="connection-state">
                    <span className={"status-dot " + statusClass} />
                    <span><strong>{agentState === "online" ? "Worker API reachable" : agentState === "checking" ? "Checking worker API" : "Worker API unavailable"}</strong>{health?.service ? " · " + health.service : ""}</span>
                  </div>
                  <div className="connection-summary-grid">
                    <div><span>Worker API address</span><strong>Configured on the web server</strong><small>NVOID_AGENT_URL</small></div>
                    <div><span>Authentication</span><strong>Server-side API key</strong><small>NVOID_AGENT_API_KEY → AGENT_API_KEY</small></div>
                    <div><span>Submission safety</span><strong>Review-only mode</strong><small>This workspace never auto-submits applications.</small></div>
                  </div>
                  <div className="field-help">Connector endpoints, API tokens and provider credentials are read by the worker process. They are never displayed in this browser page.</div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <h2 className="panel-title">MCP connectors and discovered skills</h2>
                    <p className="panel-subtitle">Every connector reported by the worker is listed here, including inactive and failed connections. Open a connected connector to inspect its actual MCP tools.</p>
                  </div>
                  <button className="secondary-button button-small" onClick={() => void Promise.all([loadSources(), loadToolCatalog()])} disabled={busy !== null}><RefreshCw size={13} /> Refresh inventory</button>
                </div>
                <div className="panel-body">
                  {sourceRefreshError && <div className="notice error"><CircleAlert size={14} />{sourceRefreshError}</div>}
                  {toolCatalogError && <div className="notice error"><CircleAlert size={14} />{toolCatalogError}</div>}
                  {sourceStatuses.length === 0 && !sourceRefreshError ? (
                    <div className="job-search-empty"><LoaderCircle size={20} className="spin" /><p>Loading connectors reported by the worker…</p></div>
                  ) : (
                    <div className="connector-grid">
                      {sourceStatuses.map((source) => {
                        const catalog = mcpToolServers.find((entry) => entry.serverId === source.id);
                        const tools = catalog?.tools ?? [];
                        const stateLabel = source.connected ? "Connected" : source.enabled ? "Connection failed" : "Inactive";
                        const stateTone = source.connected ? "source-state-connected" : source.enabled ? "source-state-error" : "source-state-inactive";
                        return (
                          <article key={source.id} className="connector-card">
                            <div className="connector-card-header">
                              <div className="connector-icon"><Server size={17} /></div>
                              <div className="connector-card-title">
                                <strong>{source.name}</strong>
                                <span>{source.id} · {source.transport || "MCP transport"}</span>
                              </div>
                              <span className={"tag " + stateTone}>{stateLabel}</span>
                            </div>
                            <div className="connector-card-stats">
                              <span>{tools.length || source.toolCount || 0} discovered tool(s)</span>
                              <span>{source.enabled ? "Enabled in worker config" : "Disabled in worker config"}</span>
                            </div>
                            {!source.enabled && <p className="connector-guidance">{connectorSetupHint(source)}</p>}
                            {source.error && <p className="connector-error">{source.error}</p>}
                            {source.connected && tools.length > 0 ? (
                              <details className="connector-tools">
                                <summary>View MCP tools and skills <span>{tools.length}</span></summary>
                                <div className="mcp-tool-list">
                                  {tools.map((tool) => {
                                    const schema = tool.inputSchema && typeof tool.inputSchema === "object" ? tool.inputSchema as { properties?: Record<string, unknown>; required?: string[] } : undefined;
                                    const requiredInputs = schema?.required ?? [];
                                    const inputNames = Object.keys(schema?.properties ?? {});
                                    const safetyLabel = tool.annotations?.destructiveHint ? "May modify data" : tool.annotations?.readOnlyHint ? "Read-only" : tool.annotations?.openWorldHint ? "External action" : "Capability metadata not declared";
                                    return (
                                      <details className="mcp-tool-item" key={tool.name}>
                                        <summary>
                                          <span><Code2 size={13} /> {tool.annotations?.title || tool.name}</span>
                                          <span className="tag">{safetyLabel}</span>
                                        </summary>
                                        <div className="mcp-tool-description">{tool.description || "This tool did not publish a description."}</div>
                                        <div className="mcp-tool-inputs">
                                          <span>Tool ID</span><code>{tool.name}</code>
                                          <span>Inputs</span><code>{inputNames.length ? inputNames.join(", ") : "No input schema published"}</code>
                                          <span>Required</span><code>{requiredInputs.length ? requiredInputs.join(", ") : "None declared"}</code>
                                        </div>
                                      </details>
                                    );
                                  })}
                                </div>
                              </details>
                            ) : source.connected ? (
                              <p className="connector-guidance">The MCP server connected, but it did not publish any tools.</p>
                            ) : null}
                          </article>
                        );
                      })}
                    </div>
                  )}
                  <div className="field-help" style={{ marginTop: 14 }}>A connector marked Inactive needs configuration and a worker restart. A connector marked Connection failed is enabled, but its endpoint, credentials or MCP handshake need attention. Connections made inside ChatGPT or Claude are not automatically inherited by this separate worker.</div>
                </div>
              </section>
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

function formatPostedAt(value?: string) {
  if (!value) return undefined;
  const numeric = Number(value);
  const date = Number.isFinite(numeric) && numeric >= 1000000000
    ? new Date(numeric < 100000000000 ? numeric * 1000 : numeric)
    : new Date(value);
  if (!Number.isFinite(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function rawFieldText(raw: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  if (!raw) return undefined;
  const normalized = new Map(Object.entries(raw).map(([key, value]) => [key.toLowerCase().replace(/[^a-z0-9]/g, ""), value]));
  for (const key of keys) {
    const value = normalized.get(key.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (value === undefined || value === null) continue;
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      const text = String(value).replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
      if (text) return text;
    }
    if (Array.isArray(value)) {
      const text = value.map((item) => {
        if (typeof item === "string" || typeof item === "number") return String(item);
        if (item && typeof item === "object") {
          const record = item as Record<string, unknown>;
          return String(record.name ?? record.label ?? record.value ?? record.text ?? "");
        }
        return "";
      }).filter(Boolean).join(" · ");
      if (text) return text;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      const lower = record.min ?? record.minimum ?? record.from ?? record.lower;
      const upper = record.max ?? record.maximum ?? record.to ?? record.upper;
      if (lower !== undefined || upper !== undefined) {
        const currency = record.currency ?? record.currencyCode ?? record.currency_code ?? record.symbol;
        const range = [lower, upper].filter((item) => item !== undefined && item !== null && String(item).trim()).join(" – ");
        const formatted = [currency, range].filter((item) => item !== undefined && item !== null && String(item).trim()).join(" ");
        if (formatted) return formatted;
      }
      const nested = record.name ?? record.label ?? record.value ?? record.text ?? record.description ?? record.title;
      if (typeof nested === "string" && nested.trim()) return nested.trim();
    }
  }
  return undefined;
}

function hostFromUrl(value?: string): string | undefined {
  if (!value) return undefined;
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return undefined; }
}

function JobCard({ job }: { job: Job }) {
  const raw = job.raw ?? {};
  const demo = job.source === "demo" || job.demo === true;
  const match = Number.isFinite(job.matchScore) ? Math.round(job.matchScore) : 0;
  const company = job.company || rawFieldText(raw, ["company", "companyName", "company_name", "employer", "organization", "organisation"]) || "Company not listed";
  const location = job.location || rawFieldText(raw, ["location", "jobLocation", "job_location", "city", "workLocation", "work_location"]) || job.country || "Location not listed";
  const listingUrl = job.jobUrl || job.applicationUrl;
  const applyUrl = job.applicationUrl && job.applicationUrl !== job.jobUrl ? job.applicationUrl : undefined;
  const sourceLabels: Record<string, string> = {
    jobicy: "Jobicy", remoteok: "Remote OK", arbeitnow: "Arbeitnow", workingnomads: "Working Nomads",
    himalayas: "Himalayas", naukri: "Naukri", linkedin: "LinkedIn Jobs", indeed: "Indeed",
    glassdoor: "Glassdoor", apna: "Apna", adzuna: "Adzuna", jooble: "Jooble",
    ziprecruiter: "ZipRecruiter", bayt: "Bayt", "serper-search": "Google Search + public-page crawler",
    remotive: "Remotive", weworkremotely: "We Work Remotely", greenhouse: "Greenhouse careers",
    lever: "Lever careers", ashby: "Ashby careers", "apify-boards": "Apify job boards", "apify-apna": "Apify Apna"
  };
  const sourceLabel = sourceLabels[job.source || ""] || job.source || "Connected job source";
  const postedAt = job.postedAt || rawFieldText(raw, ["postedAt", "posted_at", "datePosted", "date_posted", "createdAt", "created_at", "publishedAt", "pubDate", "pub_date"]);
  const postedBy = rawFieldText(raw, ["postedBy", "posted_by", "publisher", "sourceName", "source_name", "provider"]);
  const experience = job.experience || rawFieldText(raw, ["experience", "experienceLevel", "experience_level", "experienceRange", "experience_range", "yearsExperience", "yearsOfExperience", "years_of_experience", "minimumExperience", "minExperience", "min_experience", "requiredExperience", "required_experience", "exp"]);
  const employmentType = job.employmentType || rawFieldText(raw, ["employmentType", "employment_type", "jobType", "job_type", "employment", "type"]);
  const workMode = job.workMode || rawFieldText(raw, ["workMode", "work_mode", "workplaceType", "workplace_type", "remoteType", "workArrangement", "work_arrangement"]);
  const salary = job.salaryMin !== undefined || job.salaryMax !== undefined
    ? money(job.salaryMin, job.salaryMax, job.salaryCurrency)
    : rawFieldText(raw, ["salary", "salaryRange", "salary_range", "salaryText", "salary_text", "compensation", "payRange", "pay_range", "remuneration"]) || "Not disclosed";
  const description = job.description || rawFieldText(raw, ["description", "jobDescription", "job_description", "summary", "snippet", "details"]);
  const cleanDescription = description?.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
  const requirements = rawFieldText(raw, ["requirements", "qualifications", "requiredSkills", "required_skills", "mustHave", "must_haves", "skills", "whatYouNeed"]);
  const responsibilities = rawFieldText(raw, ["responsibilities", "duties", "whatYouWillDo", "what_you_will_do"]);
  const education = rawFieldText(raw, ["education", "educationRequirements", "education_requirements", "degree"]);
  const industry = rawFieldText(raw, ["industry", "sector"]);
  const department = rawFieldText(raw, ["department", "team", "function"]);
  const seniority = rawFieldText(raw, ["seniority", "level", "jobLevel", "job_level", "careerLevel", "career_level"]);
  const benefits = rawFieldText(raw, ["benefits", "perks", "compensationBenefits", "compensation_benefits"]);
  const opportunityType = rawFieldText(raw, ["opportunityType", "opportunity_type", "category"]);
  const sourceHost = hostFromUrl(listingUrl);

  return (
    <article className="job-card job-result-card">
      <div className="job-card-top">
        <div className="company-mark">{initials(company)}</div>
        <div className="job-main">
          <h3 className="job-title">{job.title}</h3>
          <div className="job-company">{company}</div>
          <div className="job-location">
            <span><MapPin size={12} />{location}</span>
            {job.country && location !== job.country && <span><Globe2 size={12} />{job.country}</span>}
          </div>
        </div>
        <span className="match-pill"><Target size={12} />{match}% fit</span>
      </div>

      <div className="job-primary-facts">
        <div className="job-primary-fact salary-fact"><span>Salary range</span><strong>{salary}</strong></div>
        <div className="job-primary-fact"><span>Experience</span><strong>{experience || "Not listed"}</strong></div>
        <div className="job-primary-fact"><span>Employment type</span><strong>{employmentType || "Not listed"}</strong></div>
      </div>

      <div className="job-meta job-meta-prominent">
        <span className="job-posted-date"><Clock3 size={12} />Posted {formatPostedAt(postedAt) || "date not provided"}</span>
        {workMode && <span className="tag"><Globe2 size={11} />{workMode}</span>}
        {seniority && <span className="tag">{seniority}</span>}
        {industry && <span className="tag">{industry}</span>}
        {department && <span className="tag">{department}</span>}
        {opportunityType && <span className="tag">{opportunityType}</span>}
        {demo && <span className="tag source-demo">Synthetic test record</span>}
      </div>

      <div className="job-description-block">
        <span className="job-section-label">About this role</span>
        <p className="job-description">{cleanDescription || "The provider did not include a job description in the returned listing."}</p>
      </div>

      {requirements && (
        <div className="job-requirements">
          <span className="job-section-label">Requirements / qualifications</span>
          <p>{requirements}</p>
        </div>
      )}

      {job.matchReasons && job.matchReasons.length > 0 && <p className="job-reasons">{job.matchReasons.slice(0, 3).join(" · ")}</p>}

      <div className="job-card-footer job-result-footer">
        <div className="job-source-details">
          <strong>Found on {sourceLabel}</strong>
          <span>{postedBy ? "Posted by " + postedBy : "Original job source"}{sourceHost ? " · " + sourceHost : ""}</span>
        </div>
        <div className="job-action-links">
          {listingUrl && <a className="text-link" href={listingUrl} target="_blank" rel="noreferrer">View original listing <ExternalLink size={12} /></a>}
          {applyUrl && <a className="text-link" href={applyUrl} target="_blank" rel="noreferrer">Apply on employer site <ArrowUpRight size={12} /></a>}
          {!listingUrl && <span className="source-text">Provider did not return a public URL</span>}
        </div>
      </div>

      <details className="job-full-details">
        <summary>Full job details, requirements and source data</summary>
        <div className="job-full-details-body">
          {cleanDescription && <section><h4>Full description</h4><p>{cleanDescription}</p></section>}
          <div className="job-detail-grid">
            {[
              ["Company", company], ["Location", location], ["Salary", salary], ["Experience", experience], ["Employment type", employmentType], ["Work mode", workMode],
              ["Education", education], ["Seniority", seniority], ["Industry", industry],
              ["Department / team", department], ["Benefits", benefits], ["Requirements", requirements],
              ["Responsibilities", responsibilities], ["Posted by", postedBy], ["Original source", sourceLabel],
              ["Posting date", formatPostedAt(postedAt)], ["Listing URL", job.jobUrl], ["Application URL", job.applicationUrl],
              ["Job reference", job.sourceJobId]
            ].filter(([, value]) => Boolean(value)).map(([label, value]) => (
              <div key={label as string}><span>{label}</span><p>{String(value)}</p></div>
            ))}
          </div>
          {job.matchReasons && job.matchReasons.length > 0 && <section><h4>Why this matched</h4><p>{job.matchReasons.join(" · ")}</p></section>}
        </div>
      </details>
    </article>
  );
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

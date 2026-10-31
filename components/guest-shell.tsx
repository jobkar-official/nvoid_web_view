"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight, BrainCircuit, BriefcaseBusiness, Bot, Check, ChevronDown, Clock3, FileText,
  Globe2, History, LockKeyhole, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Puzzle, Search, ShieldCheck, Trash2, UserRound, X
} from "lucide-react";

export type GuestSearchJob = {
  id: string;
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
  salary?: string;
  matchScore?: number;
  matchReasons?: string[];
  source?: string;
};

export type GuestSearchRecord = {
  id: string;
  jobTitle: string;
  location: string;
  searchedAt: string;
  resultCount?: number;
  jobs?: GuestSearchJob[];
  error?: string;
};

type GuestHistoryContextValue = {
  history: GuestSearchRecord[];
  saveSearch: (record: Omit<GuestSearchRecord, "id" | "searchedAt">) => string;
  updateSearch: (id: string, patch: Partial<GuestSearchRecord>) => void;
  getSearch: (id: string) => GuestSearchRecord | undefined;
  removeSearch: (id: string) => void;
  clearHistory: () => void;
};

const GuestHistoryContext = createContext<GuestHistoryContextValue | null>(null);
const STORAGE_KEY = "nvoid.guest-search-history.v1";

export function useGuestHistory() {
  const value = useContext(GuestHistoryContext);
  if (!value) throw new Error("useGuestHistory must be used inside GuestShell.");
  return value;
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    return (char === "x" ? random : (random & 3 | 8)).toString(16);
  });
}

const MAX_HISTORY_RECORDS = 30;
const MAX_SAVED_JOBS = 100;

function readHistory(): GuestSearchRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value): GuestSearchRecord[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      if (
        typeof item.id !== "string" ||
        typeof item.jobTitle !== "string" ||
        typeof item.location !== "string" ||
        typeof item.searchedAt !== "string"
      ) return [];
      const jobs = Array.isArray(item.jobs)
        ? item.jobs.filter((job): job is GuestSearchJob =>
            Boolean(job && typeof job === "object" && typeof (job as Record<string, unknown>).title === "string")
          ).slice(0, MAX_SAVED_JOBS)
        : undefined;
      return [{
        id: item.id,
        jobTitle: item.jobTitle,
        location: item.location,
        searchedAt: item.searchedAt,
        resultCount: typeof item.resultCount === "number" ? item.resultCount : undefined,
        jobs,
        error: typeof item.error === "string" ? item.error : undefined
      }];
    }).slice(0, MAX_HISTORY_RECORDS);
  } catch {
    return [];
  }
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Previously searched";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(date);
}

export function GuestShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [history, setHistory] = useState<GuestSearchRecord[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<{ id: string; jobTitle: string; location: string } | null>(null);

  useEffect(() => {
    setHistory(readHistory());
    setReady(true);
  }, []);

  useEffect(() => {
    setBrowseOpen(false);
  }, [pathname]);

  const persist = useCallback((next: GuestSearchRecord[]) => {
    const limited = next.slice(0, MAX_HISTORY_RECORDS);
    setHistory(limited);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch {
      const compacted = limited.map((item, index) => index < 8
        ? { ...item, jobs: item.jobs?.slice(0, 40).map((job) => ({ ...job, description: job.description?.slice(0, 240), matchReasons: job.matchReasons?.slice(0, 3) })) }
        : { ...item, jobs: undefined }
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
      } catch {
        const historyOnly = limited.slice(0, 20).map(({ jobs, ...item }) => item);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(historyOnly));
        } catch {}
      }
    }
  }, []);

  const saveSearch = useCallback((record: Omit<GuestSearchRecord, "id" | "searchedAt">) => {
    const item: GuestSearchRecord = { ...record, id: makeId(), searchedAt: new Date().toISOString() };
    persist([item, ...readHistory()].slice(0, MAX_HISTORY_RECORDS));
    return item.id;
  }, [persist]);

  const updateSearch = useCallback((id: string, patch: Partial<GuestSearchRecord>) => {
    persist(readHistory().map((item) => item.id === id ? { ...item, ...patch } : item));
  }, [persist]);

  const getSearch = useCallback((id: string) => readHistory().find((item) => item.id === id), []);

  const removeSearch = useCallback((id: string) => {
    if (editing?.id === id) setEditing(null);
    persist(readHistory().filter((item) => item.id !== id));
  }, [persist, editing]);

  const clearHistory = useCallback(() => {
    setEditing(null);
    persist([]);
  }, [persist]);

  const saveEdit = () => {
    if (!editing || !editing.jobTitle.trim() || !editing.location.trim()) return;
    updateSearch(editing.id, { jobTitle: editing.jobTitle.trim(), location: editing.location.trim(), resultCount: 0, jobs: [], error: undefined });
    setEditing(null);
  };

  const context = useMemo(() => ({ history, saveSearch, updateSearch, getSearch, removeSearch, clearHistory }), [history, saveSearch, updateSearch, getSearch, removeSearch, clearHistory]);

  const closeSidebarOnMobile = () => {
    if (window.matchMedia("(max-width: 850px)").matches) setSidebarOpen(false);
  };

  const links = [
    { href: "/worker", label: "Worker", icon: Bot },
    { href: "/sources", label: "Job sources", icon: Globe2 },
    { href: "/plugins", label: "Plugins", icon: Puzzle },
    { href: "/models", label: "AI models", icon: BrainCircuit },
    { href: "/release", label: "Release notes", icon: FileText },
    { href: "/about", label: "About Worker", icon: UserRound }
  ];

  return (
    <GuestHistoryContext.Provider value={context}>
      <div className="public-shell">
        {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
        <aside id="nvoid-public-sidebar" aria-label="Explore navigation" aria-hidden={!sidebarOpen} className={"public-sidebar" + (sidebarOpen ? " is-open" : "")}>
          <div className="public-sidebar-header">
            <Link href="/" className="public-brand" onClick={closeSidebarOnMobile}>
              <span className="brand-symbol"><BrainCircuit size={20} strokeWidth={1.8} /></span>
              <span className="brand-copy"><strong>Worker</strong><small>AI discovery & integrations</small></span>
            </Link>
            <button className="sidebar-collapse-button" type="button" aria-label="Close sidebar" title="Close sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></button>
          </div>

          <Link href="/job-search" className="sidebar-find-button" onClick={() => closeSidebarOnMobile()}>
            <Plus size={17} strokeWidth={2.4} />
            <span>Find jobs</span>
          </Link>

          <nav className="public-nav" aria-label="Main navigation">
            <span className="sidebar-section-label">Explore</span>
            {links.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => closeSidebarOnMobile()} className={"public-nav-link" + (pathname === item.href ? " active" : "")}>
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <Link href="/free-job-posting" className="public-nav-link" onClick={() => closeSidebarOnMobile()}>
              <BriefcaseBusiness size={16} />
              <span>For employers</span>
            </Link>
          </nav>

          <div className="sidebar-history">
            <div className="history-heading">
              <span className="sidebar-section-label">Recent searches</span>
              {history.length > 0 && <button className="history-clear" onClick={clearHistory}>Clear</button>}
            </div>
            {!ready ? <div className="history-placeholder">Loading history…</div> : history.length === 0 ? (
              <div className="history-empty"><History size={17} /><span>Your searches will appear here.</span></div>
            ) : (
              <div className="history-list">
                {history.map((item) => (
                  <div className={"history-item" + (pathname === `/search/${item.id}` ? " active" : "")} key={item.id}>
                    {editing?.id === item.id ? (
                      <div className="history-editor">
                        <input aria-label="Edit job title" value={editing.jobTitle} onChange={(event) => setEditing({ ...editing, jobTitle: event.target.value })} />
                        <input aria-label="Edit search location" value={editing.location} onChange={(event) => setEditing({ ...editing, location: event.target.value })} />
                        <div><button onClick={saveEdit} disabled={!editing.jobTitle.trim() || !editing.location.trim()}><Check size={12} /> Save</button><button onClick={() => setEditing(null)}>Cancel</button></div>
                      </div>
                    ) : (
                      <>
                        <Link href={`/search/${item.id}`} className="history-select" aria-current={pathname === `/search/${item.id}` ? "page" : undefined} onClick={closeSidebarOnMobile} title={item.jobTitle + " in " + item.location}>
                          <span className="history-search-icon"><Clock3 size={13} /></span>
                          <span className="history-copy"><strong>{item.jobTitle}</strong><small>{item.location} · {item.resultCount === undefined ? "Saved search" : `${item.resultCount} jobs`} · {formatTime(item.searchedAt)}</small></span>
                        </Link>
                        <button className="history-edit" aria-label={"Edit search " + item.jobTitle} onClick={() => setEditing({ id: item.id, jobTitle: item.jobTitle, location: item.location })}><Pencil size={12} /></button>
                        <button className="history-delete" aria-label={"Delete search " + item.jobTitle} onClick={() => removeSearch(item.id)}><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="public-sidebar-bottom">
            <div className="guest-identity">
              <span className="guest-avatar">G</span>
              <span><strong>Guest</strong><small>Browsing Worker</small></span>
              <ChevronDown size={14} />
            </div>
            <div className="guest-auth-actions">
              <Link href="/auth/signin" className="sidebar-signin" onClick={() => closeSidebarOnMobile()}>Sign in</Link>
              <Link href="/auth/register" className="sidebar-register" onClick={() => closeSidebarOnMobile()}>Create account</Link>
            </div>
            <div className="sidebar-trust"><ShieldCheck size={12} /> Search without creating an account</div>
          </div>
        </aside>

        <div className="public-main">
          <header className="public-topbar">
            <button className="sidebar-toggle-button" type="button" aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-expanded={sidebarOpen} aria-controls="nvoid-public-sidebar" title={sidebarOpen ? "Close sidebar" : "Open sidebar"} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}</button>
            <div className="topbar-breadcrumb"><span>Explore</span><span className="breadcrumb-dot">/</span><strong>{pathname.startsWith("/search/") ? history.find((item) => pathname === `/search/${item.id}`)?.jobTitle || "Saved search" : pathname === "/" ? "Home" : pathname === "/job-search" ? "Find jobs" : pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Worker"}</strong></div>
            <span className="model-status-pill" role="status" aria-label="Default AI model: Alpha - k1. This model is fixed and cannot be changed here.">
              <BrainCircuit size={15} />
              <span className="model-status-copy"><small>DEFAULT MODEL</small><strong>Alpha - k1</strong></span>
              <LockKeyhole size={12} />
            </span>
            <div className="topbar-actions">
              <div className="topbar-browse-wrap">
                <button
                  type="button"
                  className="topbar-browse-trigger"
                  aria-expanded={browseOpen}
                  aria-haspopup="menu"
                  onClick={() => setBrowseOpen((open) => !open)}
                >
                  Browse <ChevronDown size={14} />
                </button>
                {browseOpen && (
                  <div className="topbar-browse-menu" role="menu" aria-label="Browse Worker pages">
                    <span className="topbar-browse-label">WORKER ECOSYSTEM</span>
                    <Link href="/worker" role="menuitem" onClick={() => setBrowseOpen(false)}><Bot size={16} /><span><strong>Worker</strong><small>Agent runtime and capabilities</small></span></Link>
                    <Link href="/sources" role="menuitem" onClick={() => setBrowseOpen(false)}><Globe2 size={16} /><span><strong>Job sources</strong><small>Boards and career platforms</small></span></Link>
                    <Link href="/plugins" role="menuitem" onClick={() => setBrowseOpen(false)}><Puzzle size={16} /><span><strong>Plugins</strong><small>MCP tools and integrations</small></span></Link>
                    <div className="topbar-browse-divider" />
                    <span className="topbar-browse-label">PRODUCT</span>
                    <Link href="/models" role="menuitem" onClick={() => setBrowseOpen(false)}><BrainCircuit size={16} /><span><strong>AI models</strong><small>Worker model and engines</small></span></Link>
                    <Link href="/release" role="menuitem" onClick={() => setBrowseOpen(false)}><FileText size={16} /><span><strong>Release notes</strong><small>Capabilities and updates</small></span></Link>
                    <Link href="/about" role="menuitem" onClick={() => setBrowseOpen(false)}><UserRound size={16} /><span><strong>About Worker</strong><small>Product overview</small></span></Link>
                    <div className="topbar-browse-divider" />
                    <span className="topbar-browse-label">INFORMATION</span>
                    <div className="topbar-browse-legal">
                      <Link href="/free-job-posting" onClick={() => setBrowseOpen(false)}>For employers</Link>
                      <Link href="/privacy" onClick={() => setBrowseOpen(false)}>Privacy</Link>
                      <Link href="/terms" onClick={() => setBrowseOpen(false)}>Terms</Link>
                      <Link href="/cookies" onClick={() => setBrowseOpen(false)}>Cookies</Link>
                      <Link href="/security" onClick={() => setBrowseOpen(false)}>Security</Link>
                    </div>
                  </div>
                )}
              </div>
              <Link href="/auth/signin" className="topbar-login">Sign in</Link>
              <Link href="/auth/register" className="topbar-create">Create account <ArrowUpRight size={14} /></Link>
            </div>
          </header>
          <main className="public-content">{children}</main>
        </div>
      </div>
    </GuestHistoryContext.Provider>
  );
}

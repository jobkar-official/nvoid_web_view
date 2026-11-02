"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Activity, Bell, BriefcaseBusiness, Check, Clock3, FileText, FlaskConical, GraduationCap, History, Languages, LifeBuoy, MessageSquare, PanelLeftClose, PanelLeftOpen, Pencil, PlugZap, Plus, Target, Trash2, UserRound } from "lucide-react";
import { useAuth } from "../lib/context/AuthContext";

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
  sources?: Array<Record<string, unknown>>;
  orchestration?: Record<string, unknown>;
  timingsMs?: {
    titlePlanning?: number;
    sourceSearch?: number;
    detailEnrichment?: number;
    aiReranking?: number;
    total?: number;
  };
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
const MAX_HISTORY_RECORDS = 30;
const MAX_SAVED_JOBS = 1000;

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

function readHistory(): GuestSearchRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((value): GuestSearchRecord[] => {
      if (!value || typeof value !== "object") return [];
      const item = value as Record<string, unknown>;
      if (typeof item.id !== "string" || typeof item.jobTitle !== "string" || typeof item.location !== "string" || typeof item.searchedAt !== "string") return [];
      const jobs = Array.isArray(item.jobs)
        ? item.jobs.filter((job): job is GuestSearchJob => Boolean(job && typeof job === "object" && typeof (job as Record<string, unknown>).title === "string")).slice(0, MAX_SAVED_JOBS)
        : undefined;
      return [{
        id: item.id,
        jobTitle: item.jobTitle,
        location: item.location,
        searchedAt: item.searchedAt,
        resultCount: typeof item.resultCount === "number" ? item.resultCount : undefined,
        jobs,
        error: typeof item.error === "string" ? item.error : undefined,
        sources: Array.isArray(item.sources) ? item.sources.filter((source): source is Record<string, unknown> => Boolean(source && typeof source === "object")) : undefined,
        orchestration: item.orchestration && typeof item.orchestration === "object" ? item.orchestration as Record<string, unknown> : undefined,
        timingsMs: item.timingsMs && typeof item.timingsMs === "object" ? item.timingsMs as GuestSearchRecord["timingsMs"] : undefined
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

const agentLinks = [
  { href: "/connections", label: "Connections", icon: PlugZap },
  { href: "/research", label: "Research anything", icon: FlaskConical }
];

const workspaceLinks = [
  { href: "/application", label: "Applications", icon: BriefcaseBusiness },
  { href: "/highlights", label: "Open to work", icon: Target },
  { href: "/message", label: "Messages", icon: MessageSquare },
  { href: "/notification", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/support", label: "Support", icon: LifeBuoy }
];

const profileSectionLinks = [
  { id: "profile", label: "Edit profile", icon: UserRound },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Target },
  { id: "experience", label: "Experience", icon: Activity },
  { id: "languages", label: "Languages", icon: Languages },
  { id: "resume", label: "Resume", icon: FileText }
];

export function GuestShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const signedIn = isAuthenticated && Boolean(user);
  const [history, setHistory] = useState<GuestSearchRecord[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<{ id: string; jobTitle: string; location: string } | null>(null);
  const [profileSubsection, setProfileSubsection] = useState("profile");

  useEffect(() => {
    const syncProfileSubsection = () => {
      const tab = window.location.hash.slice(1);
      setProfileSubsection(profileSectionLinks.some(item => item.id === tab) ? tab : "profile");
    };
    syncProfileSubsection();
    window.addEventListener("hashchange", syncProfileSubsection);
    return () => window.removeEventListener("hashchange", syncProfileSubsection);
  }, [pathname]);

  useEffect(() => {
    setHistory(readHistory());
    setReady(true);
    if (window.matchMedia("(max-width: 850px)").matches) setSidebarOpen(false);
  }, []);

  const persist = useCallback((next: GuestSearchRecord[]) => {
    const limited = next.slice(0, MAX_HISTORY_RECORDS);
    setHistory(limited);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    } catch {
      const compacted = limited.map((item, index) => index === 0
        ? { ...item, jobs: item.jobs?.slice(0, 1000).map((job) => ({ ...job, description: job.description?.slice(0, 180), matchReasons: job.matchReasons?.slice(0, 3) })) }
        : index < 4
          ? { ...item, jobs: item.jobs?.slice(0, 100).map((job) => ({ ...job, description: job.description?.slice(0, 120), matchReasons: job.matchReasons?.slice(0, 2) })) }
          : { ...item, jobs: undefined }
      );
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(compacted));
      } catch {
        const reduced = limited.slice(0, 4).map((item, index) => index === 0
          ? { ...item, jobs: item.jobs?.slice(0, 400).map((job) => ({ ...job, description: job.description?.slice(0, 100), matchReasons: job.matchReasons?.slice(0, 2) })) }
          : { ...item, jobs: item.jobs?.slice(0, 25).map((job) => ({ ...job, description: job.description?.slice(0, 80), matchReasons: job.matchReasons?.slice(0, 1) })) }
        );
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
        } catch {
          const historyOnly = limited.slice(0, 20).map(({ jobs, ...item }) => item);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(historyOnly));
          } catch {}
        }
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
  const pageTitle = pathname.startsWith("/search/")
    ? history.find((item) => pathname === `/search/${item.id}`)?.jobTitle || "Saved search"
    : pathname === "/" ? "New search"
      : pathname === "/job-search" ? "Find opportunities"
        : pathname === "/connections" ? "Connections"
          : pathname === "/research" ? "Research anything"
            : pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Nvoid";

  return (
    <GuestHistoryContext.Provider value={context}>
      <div className="public-shell">
        {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
        <aside id="nvoid-public-sidebar" aria-label="Nvoid navigation" aria-hidden={!sidebarOpen} className={"public-sidebar" + (sidebarOpen ? " is-open" : "")}>
          <div className="public-sidebar-header">
            <Link href="/" className="public-brand" onClick={closeSidebarOnMobile}>
              <span className="brand-symbol" aria-hidden="true"><Image src="/favicon.svg" alt="" width={24} height={24} priority /></span>
              <span className="brand-copy"><strong>NVOIDAI</strong><small>Global career agent</small></span>
            </Link>
            <button className="sidebar-collapse-button" type="button" aria-label="Collapse sidebar" title="Collapse sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></button>
          </div>

          <Link href="/" className="sidebar-find-button" onClick={closeSidebarOnMobile}>
            <Plus size={17} strokeWidth={2.2} />
            <span>New search</span>
          </Link>

          <nav className="public-nav nvoid-agent-nav" aria-label="Agent">
            <span className="sidebar-section-label">Agent</span>
            {agentLinks.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return <Link key={item.href} href={item.href} onClick={closeSidebarOnMobile} className={"public-nav-link" + (active ? " active" : "")}><Icon size={16} /><span>{item.label}</span></Link>;
            })}
          </nav>

          {signedIn && (
            <nav className="public-nav nvoid-workspace-nav" aria-label="Workspace">
              <span className="sidebar-section-label">Workspace</span>
              {workspaceLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href === "/application" && pathname.startsWith("/application"));
                return (
                  <div key={item.href} className="nvoid-workspace-link-group">
                    <Link href={item.href} onClick={closeSidebarOnMobile} className={"public-nav-link" + (active ? " active" : "")}><Icon size={16} /><span>{item.label}</span></Link>
                    {item.href === "/profile" && (
                      <div className="nvoid-profile-subnav" role="group" aria-label="Profile sections">
                        {profileSectionLinks.map((section) => {
                          const SectionIcon = section.icon;
                          const subsectionActive = pathname === "/profile" && profileSubsection === section.id;
                          return <Link key={section.id} href={section.id === "profile" ? "/profile" : "/profile#" + section.id} onClick={closeSidebarOnMobile} aria-current={subsectionActive ? "page" : undefined} className={"public-nav-link" + (subsectionActive ? " active" : "")}><SectionIcon size={14} /><span>{section.label}</span></Link>;
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}

          <section className="sidebar-history" aria-label="Recent searches">
            <div className="history-heading">
              <span className="sidebar-section-label">Recent searches</span>
              {history.length > 0 && <button className="history-clear" onClick={clearHistory}>Clear</button>}
            </div>
            {!ready ? <div className="history-placeholder">Loading searches…</div> : history.length === 0 ? (
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
                          <span className="history-copy"><strong>{item.jobTitle}</strong><small>{item.location} · {item.resultCount === undefined ? "Saved search" : `${item.resultCount} results`} · {formatTime(item.searchedAt)}</small></span>
                        </Link>
                        <button className="history-edit" aria-label={"Edit search " + item.jobTitle} onClick={() => setEditing({ id: item.id, jobTitle: item.jobTitle, location: item.location })}><Pencil size={12} /></button>
                        <button className="history-delete" aria-label={"Delete search " + item.jobTitle} onClick={() => removeSearch(item.id)}><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="public-sidebar-bottom">
            {signedIn && user ? (
              <>
                <div className="guest-identity">
                  <span className="guest-avatar">{user.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "N"}</span>
                  <span><strong>{user.name}</strong><small>Signed in</small></span>
                </div>
                <div className="guest-auth-actions">
                  <Link href="/profile" className="sidebar-signin" onClick={closeSidebarOnMobile}>Profile</Link>
                  <button type="button" className="sidebar-register" onClick={() => void logout()}>Sign out</button>
                </div>
              </>
            ) : isLoading ? (
              <div className="guest-identity"><span className="guest-avatar">…</span><span><strong>Restoring session</strong><small>Checking account</small></span></div>
            ) : (
              <>
                <div className="guest-identity"><span className="guest-avatar">G</span><span><strong>Guest</strong><small>Explore Nvoid</small></span></div>
                <div className="guest-auth-actions">
                  <Link href="/auth/signin" className="sidebar-signin" onClick={closeSidebarOnMobile}>Sign in</Link>
                  <Link href="/auth/register" className="sidebar-register" onClick={closeSidebarOnMobile}>Create account</Link>
                </div>
              </>
            )}
          </div>
        </aside>

        <div className="public-main">
          <header className="public-topbar">
            <button className="sidebar-toggle-button" type="button" aria-label={sidebarOpen ? "Collapse sidebar" : "Open sidebar"} aria-expanded={sidebarOpen} aria-controls="nvoid-public-sidebar" title={sidebarOpen ? "Collapse sidebar" : "Open sidebar"} onClick={() => setSidebarOpen((open) => !open)}>
              {sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}
            </button>
            <div className="topbar-breadcrumb"><strong>{pageTitle}</strong></div>
            <nav className="nvoid-header-actions" aria-label="Account and hiring links">
              {signedIn ? (
                <button type="button" className="nvoid-header-logout" onClick={() => void logout()}>Logout</button>
              ) : (
                <>
                  <Link href="/auth/signin" className="nvoid-header-login" onClick={closeSidebarOnMobile}>Login</Link>
                  <span className="nvoid-header-dash" aria-hidden="true">-</span>
                  <Link href="/auth/register" className="nvoid-header-signup" onClick={closeSidebarOnMobile}>Sign Up</Link>
                </>
              )}
              <span className="nvoid-header-divider" aria-hidden="true">|</span>
              <Link href="/free-job-posting" className="nvoid-header-free-posting" onClick={closeSidebarOnMobile}>Free Job Posting</Link>
            </nav>
          </header>
          <main className="public-content">{children}</main>
        </div>
      </div>
    </GuestHistoryContext.Provider>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import WorkerMark from "./worker-mark";
import { useAuth } from "../lib/context/AuthContext";
import {
  Activity, ArrowUpRight, Bell, BrainCircuit, BriefcaseBusiness, Check, ChevronDown,
  CircleHelp, ClipboardList, Clock3, Code2, FileText, GraduationCap, History, LayoutDashboard,
  MessageSquare, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Search, ShieldCheck, Target,
  Trash2, UserRound, X
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

const privateNavigation = [
  { label: "Workspace", items: [{ href: "/workspace", label: "Overview", icon: LayoutDashboard }, { href: "/workspace/connections", label: "API connections", icon: Code2 }] },
  { label: "Discover", items: [{ href: "/workspace/find-jobs", label: "Find jobs", icon: Search }, { href: "/workspace/recommendations", label: "Recommended jobs", icon: BrainCircuit }, { href: "/workspace/saved", label: "Saved jobs", icon: BriefcaseBusiness }, { href: "/workspace/applications", label: "Applications", icon: ClipboardList }] },
  { label: "Profile", items: [{ href: "/workspace/profile", label: "Profile", icon: UserRound }, { href: "/workspace/skills", label: "Skills", icon: Target }, { href: "/workspace/education", label: "Education", icon: GraduationCap }, { href: "/workspace/experience", label: "Experience", icon: Activity }, { href: "/workspace/resume", label: "Resume", icon: FileText }] },
  { label: "Activity", items: [{ href: "/workspace/highlights", label: "Open to work", icon: Target }, { href: "/workspace/messages", label: "Messages", icon: MessageSquare }, { href: "/workspace/notifications", label: "Notifications", icon: Bell }] },
  { label: "Help", items: [{ href: "/workspace/support", label: "Support", icon: CircleHelp }] }
];

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
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const signedIn = isAuthenticated && Boolean(user);
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
              <span className="brand-symbol"><WorkerMark size={22} /></span>
              <span className="brand-copy"><strong>Worker</strong><small>AI discovery & integrations</small></span>
            </Link>
            <button className="sidebar-collapse-button" type="button" aria-label="Close sidebar" title="Close sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></button>
          </div>

          <Link href={signedIn ? "/workspace/find-jobs" : "/job-search"} className="sidebar-find-button" onClick={() => closeSidebarOnMobile()}>
            <Plus size={17} strokeWidth={2.4} />
            <span>Find jobs</span>
          </Link>

          <nav className="public-nav" aria-label="Main navigation">
            {signedIn ? privateNavigation.map((group) => (
              <div className="private-nav-group" key={group.label}>
                <span className="sidebar-section-label">{group.label}</span>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = item.href === "/workspace" ? pathname === "/workspace" : pathname === item.href;
                  return (
                    <Link key={item.href} href={item.href} onClick={() => closeSidebarOnMobile()} className={"public-nav-link" + (active ? " active" : "")}>
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )) : isLoading ? (
              <div className="history-placeholder">Restoring your workspace…</div>
            ) : (
              <>
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
              </>
            )}
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
            {signedIn && user ? (
              <>
                <div className="guest-identity">
                  <span className="guest-avatar">{user.name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join("") || "W"}</span>
                  <span><strong>{user.name}</strong><small>{user.role === "recruiter" ? "Recruiter" : "Job seeker"}</small></span>
                </div>
                <div className="guest-auth-actions">
                  <Link href="/workspace" className="sidebar-signin" onClick={() => closeSidebarOnMobile()}>Workspace</Link>
                  <button type="button" className="sidebar-register" onClick={() => void logout()}>Sign out</button>
                </div>
                <div className="sidebar-trust"><ShieldCheck size={12} /> Your private workspace is active</div>
              </>
            ) : isLoading ? (
              <div className="guest-identity">
                <span className="guest-avatar">…</span>
                <span><strong>Restoring session</strong><small>Checking secure cookies</small></span>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </aside>

        <div className="public-main">
          <header className="public-topbar">
            <button className="sidebar-toggle-button" type="button" aria-label={sidebarOpen ? "Close navigation" : "Open navigation"} aria-expanded={sidebarOpen} aria-controls="nvoid-public-sidebar" title={sidebarOpen ? "Close sidebar" : "Open sidebar"} onClick={() => setSidebarOpen((open) => !open)}>{sidebarOpen ? <PanelLeftClose size={19} /> : <PanelLeftOpen size={19} />}</button>
            <div className="topbar-breadcrumb"><span>{signedIn ? "Workspace" : "Explore"}</span><span className="breadcrumb-dot">/</span><strong>{pathname.startsWith("/search/") ? history.find((item) => pathname === `/search/${item.id}`)?.jobTitle || "Saved search" : pathname === "/" ? "Home" : pathname === "/job-search" ? "Find jobs" : pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Worker"}</strong></div>
            <div className="topbar-actions">
              <div
                className="topbar-browse-wrap"
                onPointerEnter={(event) => {
                  if (event.pointerType !== "touch") setBrowseOpen(true);
                }}
                onPointerLeave={(event) => {
                  if (event.pointerType !== "touch") setBrowseOpen(false);
                }}
                onFocus={() => setBrowseOpen(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setBrowseOpen(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setBrowseOpen(false);
                }}
              >
                <button
                  type="button"
                  className="topbar-browse-trigger"
                  id="worker-browse-trigger"
                  aria-expanded={browseOpen}
                  aria-controls="worker-browse-menu"
                  aria-haspopup="menu"
                  onClick={() => setBrowseOpen((open) => !open)}
                >
                  Browse <ChevronDown size={14} />
                </button>
                {browseOpen && (
                  <div className="topbar-browse-menu" id="worker-browse-menu" role="menu" aria-label="Browse Worker pages">
                    <div className="topbar-browse-heading">
                      <span className="topbar-browse-kicker">EXPLORE WORKER</span>
                      <strong>Everything in one place</strong>
                      <p>Explore product information and the latest updates.</p>
                    </div>
                    <div className="topbar-browse-grid">
                      <Link href="/models" className="topbar-browse-card" role="menuitem" onClick={() => setBrowseOpen(false)}>
                        <span className="topbar-browse-card-icon"><BrainCircuit size={18} /></span>
                        <span><strong>AI models</strong><small>Worker model and engines</small></span>
                        <ArrowUpRight size={13} />
                      </Link>
                      <Link href="/release" className="topbar-browse-card" role="menuitem" onClick={() => setBrowseOpen(false)}>
                        <span className="topbar-browse-card-icon"><FileText size={18} /></span>
                        <span><strong>Release notes</strong><small>See what's new in Worker</small></span>
                        <ArrowUpRight size={13} />
                      </Link>
                      <Link href="/about" className="topbar-browse-card" role="menuitem" onClick={() => setBrowseOpen(false)}>
                        <span className="topbar-browse-card-icon"><UserRound size={18} /></span>
                        <span><strong>About Worker</strong><small>Learn about the platform</small></span>
                        <ArrowUpRight size={13} />
                      </Link>
                    </div>
                    <div className="topbar-browse-footer">
                      <span>WORKER RESOURCES</span>
                      <div>
                        <Link href="/privacy" onClick={() => setBrowseOpen(false)}>Privacy</Link>
                        <Link href="/terms" onClick={() => setBrowseOpen(false)}>Terms</Link>
                        <Link href="/cookies" onClick={() => setBrowseOpen(false)}>Cookies</Link>
                        <Link href="/security" onClick={() => setBrowseOpen(false)}>Security</Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {signedIn ? (
                <>
                  <Link href="/workspace" className="topbar-login">Workspace</Link>
                  <button type="button" className="topbar-create" onClick={() => void logout()}>Sign out</button>
                </>
              ) : isLoading ? (
                <span className="topbar-login">Checking session…</span>
              ) : (
                <>
                  <Link href="/auth/signin" className="topbar-login">Sign in</Link>
                  <Link href="/auth/register" className="topbar-create">Create account <ArrowUpRight size={14} /></Link>
                  <span className="topbar-action-separator" aria-hidden="true">|</span>
                  <Link href="/free-job-posting" className="topbar-employer"><BriefcaseBusiness size={13} /> Free Hiring</Link>
                </>
              )}
            </div>
          </header>
          <main className="public-content">{children}</main>
        </div>
      </div>
    </GuestHistoryContext.Provider>
  );
}

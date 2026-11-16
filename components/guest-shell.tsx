"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { Bell, BriefcaseBusiness, ChevronRight, Clock3, GroupIcon, History, LifeBuoy, MessageSquare, PanelLeftClose, PanelLeftOpen, Plus, Target, Trash2, UserRound } from "lucide-react";
import { useAuth } from "../lib/context/AuthContext";
import { countLabel, timeAgo } from "../lib/jobs/format";

export type SearchRecord = {
  id: string;
  jobTitle: string;
  location: string;
  resultCount: number;
  searchedAt: string;
};

type HistoryContextValue = {
  history: SearchRecord[];
  saveSearch: (record: Omit<SearchRecord, "id" | "searchedAt">) => void;
  removeSearch: (id: string) => void;
  clearHistory: () => void;
};

const HistoryContext = createContext<HistoryContextValue | null>(null);
const STORAGE_KEY = "nvoid.search-history.v2";
const MAX_RECORDS = 20;

export function useGuestHistory() {
  const value = useContext(HistoryContext);
  if (!value) throw new Error("useGuestHistory must be used inside GuestShell.");
  return value;
}

function isRecord(value: unknown): value is SearchRecord {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.jobTitle === "string" && typeof item.location === "string" && typeof item.resultCount === "number" && typeof item.searchedAt === "string";
}

function readHistory(): SearchRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(parsed) ? parsed.filter(isRecord).slice(0, MAX_RECORDS) : [];
  } catch {
    return [];
  }
}

function writeHistory(records: SearchRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return true;
  } catch {
    return false;
  }
}

const searchKey = (record: Pick<SearchRecord, "jobTitle" | "location">) => `${record.jobTitle.trim().toLowerCase()}|${record.location.trim().toLowerCase()}`;

function searchHref(record: Pick<SearchRecord, "jobTitle" | "location">) {
  const params = new URLSearchParams();
  if (record.jobTitle) params.set("role", record.jobTitle);
  if (record.location) params.set("location", record.location);
  return `/job-search?${params}`;
}

const agentLinks = [
  { href: "/jobs", label: "My Jobs", icon: BriefcaseBusiness },
  { href: "/people", label: "Grow Network", icon: GroupIcon },
];

const workspaceLinks = [
  { href: "/application", label: "Applications", icon: BriefcaseBusiness },
  { href: "/highlights", label: "Open to work", icon: Target },
  { href: "/message", label: "Messages", icon: MessageSquare },
  { href: "/notification", label: "Notifications", icon: Bell },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/support", label: "Support", icon: LifeBuoy }
];

export function GuestShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const signedIn = isAuthenticated && Boolean(user);
  const [history, setHistory] = useState<SearchRecord[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setHistory(readHistory());
    setReady(true);

    const breakpoint = window.matchMedia("(max-width: 850px)");
    const syncSidebar = () => setSidebarOpen(!breakpoint.matches);
    syncSidebar();
    breakpoint.addEventListener("change", syncSidebar);

    return () => breakpoint.removeEventListener("change", syncSidebar);
  }, []);

  useEffect(() => {
    if (!sidebarOpen || !window.matchMedia("(max-width: 850px)").matches) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSidebarOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [sidebarOpen]);

  const persist = useCallback((next: SearchRecord[]) => {
    const limited = next.slice(0, MAX_RECORDS);
    setHistory(limited);
    writeHistory(limited);
  }, []);

  const saveSearch = useCallback((record: Omit<SearchRecord, "id" | "searchedAt">) => {
    const entry: SearchRecord = { ...record, id: `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`, searchedAt: new Date().toISOString() };
    persist([entry, ...readHistory().filter((item) => searchKey(item) !== searchKey(record))]);
  }, [persist]);

  const removeSearch = useCallback((id: string) => persist(readHistory().filter((item) => item.id !== id)), [persist]);
  const clearHistory = useCallback(() => persist([]), [persist]);

  const context = useMemo(() => ({ history, saveSearch, removeSearch, clearHistory }), [history, saveSearch, removeSearch, clearHistory]);
  const closeSidebarOnMobile = () => {
    if (window.matchMedia("(max-width: 850px)").matches) setSidebarOpen(false);
  };
  const routeTitles: Record<string, string> = {
    "/": "New search",
    "/job-search": "Find jobs",
    "/jobs": "My jobs",
    "/people": "Grow network",
    "/application": "Applications",
    "/highlights": "Open to work",
    "/message": "Messages",
    "/notification": "Notifications",
    "/profile": "Profile",
    "/support": "Support",
    "/models": "Models",
    "/models/alpha-k1": "Alpha K1",
    "/about": "About NvoidAI",
    "/privacy": "Privacy",
    "/terms": "Terms",
    "/cookies": "Cookies",
    "/auth/signin": "Sign in",
    "/auth/register": "Create account",
    "/auth/forgot-password": "Reset password"
  };
  const fallbackTitle = pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Nvoid";
  const pageTitle = routeTitles[pathname] || fallbackTitle.replace(/\b\w/g, (character) => character.toUpperCase());

  return (
    <HistoryContext.Provider value={context}>
      <div className="public-shell">
        {sidebarOpen && <button className="sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
        <aside id="nvoid-public-sidebar" aria-label="Nvoid navigation" className={"public-sidebar" + (sidebarOpen ? " is-open" : "")}>
          <div className="public-sidebar-header">
            <Link href="/" className="public-brand" onClick={closeSidebarOnMobile}>
              <Image
                src="/logo.png"
                alt=""
                width={44}
                height={44}
                priority
                style={{ filter: "brightness(0) invert(1)" }}
              />

              <span className="brand-copy"><strong>NVOIDAI</strong><small>Global career agent</small></span>
            </Link>
          </div>

          <Link href="/" className={"sidebar-find-button" + (pathname === "/" ? " active" : "")} aria-current={pathname === "/" ? "page" : undefined} aria-label="New search" title="New search" onClick={closeSidebarOnMobile}>
            <Plus size={17} strokeWidth={2.2} />
            <span>New search</span>
          </Link>

          <nav className="public-nav nvoid-agent-nav" aria-label="Agent">
            <span className="sidebar-section-label">Agent</span>
            {agentLinks.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} aria-current={active ? "page" : undefined} onClick={closeSidebarOnMobile} className={"public-nav-link" + (active ? " active" : "")}><Icon size={18} strokeWidth={1.8} /><span>{item.label}</span></Link>;
            })}
          </nav>

          {signedIn && (
            <nav className="public-nav nvoid-workspace-nav" aria-label="Your career">
              <span className="sidebar-section-label">Your career</span>
              {workspaceLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href === "/application" && pathname.startsWith("/application"));
                return <Link key={item.href} href={item.href} title={item.label} aria-label={item.label} aria-current={active ? "page" : undefined} onClick={closeSidebarOnMobile} className={"public-nav-link" + (active ? " active" : "")}><Icon size={17} strokeWidth={1.9} /><span>{item.label}</span></Link>;
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
                  <div className="history-item" key={item.id}>
                    <Link href={searchHref(item)} className="history-select" onClick={closeSidebarOnMobile} title={`${item.jobTitle || "All jobs"}${item.location ? ` in ${item.location}` : ""}`}>
                      <span className="history-search-icon"><Clock3 size={13} /></span>
                      <span className="history-copy"><strong>{item.jobTitle || "All jobs"}</strong><small>{item.location || "Anywhere"} · {countLabel(item.resultCount)} jobs · {timeAgo(item.searchedAt)}</small></span>
                    </Link>
                    <button className="history-delete" aria-label={`Delete search ${item.jobTitle}`} onClick={() => removeSearch(item.id)}><Trash2 size={13} /></button>
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
                  <Link href="/profile" className="sidebar-profile-link" onClick={closeSidebarOnMobile}>Profile</Link>
                  <button type="button" className="sidebar-signout" onClick={() => void logout()}>Sign out</button>
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
            <button className={"sidebar-toggle-button" + (sidebarOpen ? " is-expanded" : " is-collapsed")} type="button" aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} aria-expanded={sidebarOpen} aria-controls="nvoid-public-sidebar" title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"} onClick={() => setSidebarOpen((open) => !open)}>
              {sidebarOpen ? <PanelLeftClose size={19} strokeWidth={1.9} /> : <PanelLeftOpen size={19} strokeWidth={1.9} />}
            </button>
            <div className="topbar-breadcrumb">
              <Link href="/" className="topbar-home" aria-label="NvoidAI home">NVOIDAI</Link>
              <ChevronRight size={14} aria-hidden="true" />
              <span>{pageTitle}</span>
            </div>
            <nav className="nvoid-header-actions" aria-label="Account and employer actions">
              {!signedIn && !isLoading ? (
                <>
                  <Link href="/auth/signin" className="nvoid-header-login" onClick={closeSidebarOnMobile}>Log in</Link>
                  <Link href="/auth/register" className="nvoid-header-signup" onClick={closeSidebarOnMobile}>Sign up</Link>
                </>
              ) : signedIn ? (
                <Link href="/profile" className="nvoid-header-login" onClick={closeSidebarOnMobile}>Profile</Link>
              ) : null}
              <span className="nvoid-header-employer-divider" aria-hidden="true" />
              <Link href="https://hiring.nvoidai.com/auth/login" className="nvoid-header-free-posting" onClick={closeSidebarOnMobile}>
                <span className="nvoid-header-free-posting-icon" aria-hidden="true"><BriefcaseBusiness size={16} strokeWidth={2} /></span>
                <span>Free Job Posting</span>
              </Link>
            </nav>
          </header>
          <main className="public-content">{children}</main>
        </div>
      </div>
    </HistoryContext.Provider>
  );
}

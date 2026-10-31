"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowUpRight, BrainCircuit, BriefcaseBusiness, Check, ChevronDown, Clock3, FileText,
  History, LockKeyhole, PanelLeftClose, PanelLeftOpen, Pencil, Plus, Search, ShieldCheck, Trash2, UserRound, X
} from "lucide-react";

export type GuestSearchRecord = {
  id: string;
  jobTitle: string;
  location: string;
  searchedAt: string;
  resultCount?: number;
};

type GuestHistoryContextValue = {
  history: GuestSearchRecord[];
  saveSearch: (record: Omit<GuestSearchRecord, "id" | "searchedAt">) => string;
  updateSearch: (id: string, patch: Partial<GuestSearchRecord>) => void;
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

function readHistory(): GuestSearchRecord[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is GuestSearchRecord =>
      item && typeof item.id === "string" &&
      typeof item.jobTitle === "string" &&
      typeof item.location === "string" &&
      typeof item.searchedAt === "string"
    ).slice(0, 40);
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
  const router = useRouter();
  const [history, setHistory] = useState<GuestSearchRecord[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState<{ id: string; jobTitle: string; location: string } | null>(null);

  useEffect(() => {
    setHistory(readHistory());
    setReady(true);
  }, []);

  const persist = useCallback((next: GuestSearchRecord[]) => {
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      setHistory(next);
    }
  }, []);

  const saveSearch = useCallback((record: Omit<GuestSearchRecord, "id" | "searchedAt">) => {
    const item: GuestSearchRecord = { ...record, id: makeId(), searchedAt: new Date().toISOString() };
    persist([item, ...readHistory()].slice(0, 40));
    return item.id;
  }, [persist]);

  const updateSearch = useCallback((id: string, patch: Partial<GuestSearchRecord>) => {
    persist(readHistory().map((item) => item.id === id ? { ...item, ...patch } : item));
  }, [persist]);

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
    updateSearch(editing.id, { jobTitle: editing.jobTitle.trim(), location: editing.location.trim() });
    setEditing(null);
  };

  const context = useMemo(() => ({ history, saveSearch, updateSearch, removeSearch, clearHistory }), [history, saveSearch, updateSearch, removeSearch, clearHistory]);

  const closeSidebarOnMobile = () => {
    if (window.matchMedia("(max-width: 850px)").matches) setSidebarOpen(false);
  };

  const selectSearch = (item: GuestSearchRecord) => {
    if (pathname !== "/") router.push("/");
    window.setTimeout(() => window.dispatchEvent(new CustomEvent("nvoid:select-search", { detail: item })), pathname === "/" ? 0 : 250);
    closeSidebarOnMobile();
  };

  const links = [
    { href: "/", label: "Find jobs", icon: Search },
    { href: "/models", label: "AI models", icon: BrainCircuit },
    { href: "/release", label: "Release notes", icon: FileText },
    { href: "/about", label: "About Nvoid", icon: UserRound }
  ];

  return (
    <GuestHistoryContext.Provider value={context}>
      <div className="public-shell">
        {sidebarOpen && <button className="sidebar-scrim" aria-label="Close menu" onClick={() => setSidebarOpen(false)} />}
        <aside id="nvoid-public-sidebar" aria-label="Explore navigation" aria-hidden={!sidebarOpen} className={"public-sidebar" + (sidebarOpen ? " is-open" : "")}>
          <div className="public-sidebar-header">
            <Link href="/" className="public-brand" onClick={closeSidebarOnMobile}>
              <span className="brand-symbol"><BrainCircuit size={20} strokeWidth={1.8} /></span>
              <span className="brand-copy"><strong>nvoid.ai</strong><small>Find opportunities. Let AI find more.</small></span>
            </Link>
            <button className="sidebar-collapse-button" type="button" aria-label="Close sidebar" title="Close sidebar" onClick={() => setSidebarOpen(false)}><PanelLeftClose size={18} /></button>
          </div>

          <Link href="/#job-search" className="sidebar-find-button" onClick={() => closeSidebarOnMobile()}>
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
                  <div className="history-item" key={item.id}>
                    {editing?.id === item.id ? (
                      <div className="history-editor">
                        <input aria-label="Edit job title" value={editing.jobTitle} onChange={(event) => setEditing({ ...editing, jobTitle: event.target.value })} />
                        <input aria-label="Edit search location" value={editing.location} onChange={(event) => setEditing({ ...editing, location: event.target.value })} />
                        <div><button onClick={saveEdit} disabled={!editing.jobTitle.trim() || !editing.location.trim()}><Check size={12} /> Save</button><button onClick={() => setEditing(null)}>Cancel</button></div>
                      </div>
                    ) : (
                      <>
                        <button className="history-select" onClick={() => selectSearch(item)} title={item.jobTitle + " in " + item.location}>
                          <span className="history-search-icon"><Clock3 size={13} /></span>
                          <span className="history-copy"><strong>{item.jobTitle}</strong><small>{item.location} · {formatTime(item.searchedAt)}</small></span>
                        </button>
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
              <span><strong>Guest</strong><small>Browsing Nvoid</small></span>
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
            <div className="topbar-breadcrumb"><span>Explore</span><span className="breadcrumb-dot">/</span><strong>{pathname === "/" ? "Find jobs" : pathname.split("/").filter(Boolean).slice(-1)[0]?.replace(/-/g, " ") || "Nvoid"}</strong></div>
            <span className="model-status-pill" role="status" aria-label="Default AI model: Alpha - k1. This model is fixed and cannot be changed here.">
              <BrainCircuit size={15} />
              <span className="model-status-copy"><small>DEFAULT MODEL</small><strong>Alpha - k1</strong></span>
              <LockKeyhole size={12} />
            </span>
            <div className="topbar-actions">
              <Link href="/security" className="topbar-quiet-link">Security</Link>
              <Link href="/auth/signin" className="topbar-login">Sign in</Link>
              <Link href="/auth/register" className="topbar-create">Create account <ArrowUpRight size={14} /></Link>
            </div>
          </header>
          <main className="public-content">{children}</main>
          <footer className="public-footer">
            <span>© {new Date().getFullYear()} Nvoid</span>
            <div>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/cookies">Cookies</Link>
              <Link href="/security">Security</Link>
            </div>
          </footer>
        </div>
      </div>
    </GuestHistoryContext.Provider>
  );
}

"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowDownUp,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  X
} from "lucide-react";
import styles from "./indexed-jobs-page.module.css";

type Job = {
  id: string;
  title: string;
  company?: string | null;
  location?: string;
  url?: string;
  applyUrl?: string;
  description?: string;
  salary?: string;
  remote?: boolean;
  postedAt?: string | null;
  firstSeen?: string | null;
  provider?: string;
  source?: string;
};

type Filters = {
  query: string;
  skills: string;
  location: string;
  company: string;
  provider: string;
  remote: string;
};

type JobsResponse = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  jobs?: Job[];
  error?: string;
  facets?: { providers?: Array<{ id: string; count: number }> };
};

const emptyFilters: Filters = { query: "", skills: "", location: "", company: "", provider: "", remote: "" };
const pageSize = 24;

function cleanText(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\s+/g, " ").trim();
}

function safeJobUrl(value?: string) {
  if (!value) return undefined;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.toString() : undefined;
  } catch {
    return undefined;
  }
}

function formatPostedDate(value?: string | null) {
  if (!value) return "Date not provided";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "Date not provided";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(parsed);
}

function providerLabel(value?: string) {
  if (!value) return "Company career page";
  const labels: Record<string, string> = {
    greenhouse: "Greenhouse",
    lever: "Lever",
    ashby: "Ashby",
    smartrecruiters: "SmartRecruiters",
    boards: "Company career page",
    web: "Public web search",
    recruitee: "Recruitee",
    workable: "Workable",
    workday: "Workday"
  };
  return labels[value.toLowerCase()] || value;
}

export default function IndexedJobsPage() {
  const [draft, setDraft] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [providers, setProviders] = useState<Array<{ id: string; count: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const requestQuery = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize), sort });
    if (filters.query) params.set("q", filters.query);
    if (filters.skills) params.set("skills", filters.skills);
    if (filters.location) params.set("location", filters.location);
    if (filters.company) params.set("company", filters.company);
    if (filters.provider) params.set("provider", filters.provider);
    if (filters.remote) params.set("remote", filters.remote);
    return params.toString();
  }, [filters, page, sort]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");

    async function loadJobs() {
      try {
        const response = await fetch("/api/agent/index-jobs?" + requestQuery, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal
        });
        const payload: unknown = await response.json().catch(() => ({}));
        if (!response.ok) {
          const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
          throw new Error(typeof record.error === "string" ? record.error : "Nvoid Engine could not load the indexed jobs.");
        }
        const result = payload as JobsResponse;
        setJobs(Array.isArray(result.jobs) ? result.jobs : []);
        setTotal(typeof result.total === "number" ? result.total : 0);
        setProviders(Array.isArray(result.facets?.providers) ? result.facets.providers : []);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setJobs([]);
        setTotal(0);
        setError(caught instanceof Error ? caught.message : "The indexed job catalogue could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadJobs();
    return () => controller.abort();
  }, [requestQuery]);

  function updateDraft(key: keyof Filters, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draft });
    setMobileFiltersOpen(false);
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
    setMobileFiltersOpen(false);
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, total);
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroCopy}>
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowMark}><Sparkles size={13} /></span>
            NVOIDAI <span className={styles.eyebrowDivider}>/</span> JOB INDEX
          </div>
          <h1>Find work that moves you forward.</h1>
          <p>Explore open roles collected from company career pages. Search by skill, compare opportunities and go directly to the original listing.</p>
          <div className={styles.heroMeta}>
            <span><Check size={14} /> Direct company listings</span>
            <span><Check size={14} /> One searchable index</span>
          </div>
        </div>
        <div className={styles.heroMetric} aria-live="polite">
          <span className={styles.metricLabel}>OPEN OPPORTUNITIES</span>
          <div className={styles.metricValue}>{loading ? "—" : total.toLocaleString("en-IN")}</div>
          <span className={styles.metricFoot}><span className={styles.statusDot} /> {loading ? "Updating the index" : "Current indexed roles"}</span>
        </div>
        <div className={styles.heroDecoration} aria-hidden="true" />
      </header>

      <div className={styles.mobileFilterBar}>
        <button type="button" onClick={() => setMobileFiltersOpen((open) => !open)} aria-expanded={mobileFiltersOpen}>
          <SlidersHorizontal size={16} /> {"Filters" + (activeFilterCount ? " · " + activeFilterCount : "")}
        </button>
        <span>{total.toLocaleString("en-IN")} open roles</span>
      </div>

      <div className={styles.workspace}>
        <aside className={styles.filterPanel + (mobileFiltersOpen ? " " + styles.filterPanelOpen : "")}>
          <form onSubmit={submitFilters}>
            <div className={styles.filterHeader}>
              <div className={styles.filterHeading}>
                <span className={styles.filterIcon}><Filter size={16} /></span>
                <span><strong>Refine your search</strong><small>Find the right opportunity</small></span>
              </div>
              <button className={styles.clearButton} type="button" onClick={clearFilters} disabled={activeFilterCount === 0 && Object.values(draft).every((value) => !value)}>
                Clear all
              </button>
            </div>

            <div className={styles.filterFields}>
              <label className={styles.field}>
                <span className={styles.fieldLabel}>KEYWORD OR ROLE</span>
                <div className={styles.inputWrap}>
                  <Search size={16} aria-hidden="true" />
                  <input value={draft.query} onChange={(event) => updateDraft("query", event.target.value)} placeholder="e.g. Product designer" autoComplete="off" />
                </div>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>SKILLS</span>
                <div className={styles.inputWrap}>
                  <Sparkles size={16} aria-hidden="true" />
                  <input value={draft.skills} onChange={(event) => updateDraft("skills", event.target.value)} placeholder="e.g. Java, React, SQL" autoComplete="off" />
                </div>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>LOCATION</span>
                <div className={styles.inputWrap}>
                  <MapPin size={16} aria-hidden="true" />
                  <input value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} placeholder="City, state or country" autoComplete="off" />
                </div>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>COMPANY</span>
                <div className={styles.inputWrap}>
                  <Building2 size={16} aria-hidden="true" />
                  <input value={draft.company} onChange={(event) => updateDraft("company", event.target.value)} placeholder="Search a company" autoComplete="off" />
                </div>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>JOB SOURCE</span>
                <select value={draft.provider} onChange={(event) => updateDraft("provider", event.target.value)}>
                  <option value="">All sources</option>
                  {providers.filter((item) => item.id).map((item) => (
                    <option key={item.id} value={item.id}>{providerLabel(item.id)} ({item.count.toLocaleString("en-IN")})</option>
                  ))}
                </select>
              </label>

              <label className={styles.field}>
                <span className={styles.fieldLabel}>WORK ARRANGEMENT</span>
                <select value={draft.remote} onChange={(event) => updateDraft("remote", event.target.value)}>
                  <option value="">Any arrangement</option>
                  <option value="true">Remote</option>
                  <option value="false">On-site / hybrid / unspecified</option>
                </select>
              </label>
            </div>

            <div className={styles.filterFooter}>
              <button className={styles.applyFilters} type="submit">
                <span>Apply filters</span><ArrowRight size={16} />
              </button>
              <p>Results update using your selected criteria.</p>
            </div>
          </form>
        </aside>

        <section className={styles.results} aria-label="Open job opportunities">
          <div className={styles.resultsToolbar}>
            <div className={styles.resultsSummary}>
              <span className={styles.sectionKicker}>OPPORTUNITIES</span>
              <h2>Open positions <span>{total.toLocaleString("en-IN")}</span></h2>
              <p>{loading ? "Finding the latest indexed roles…" : total > 0 ? "Showing " + firstResult.toLocaleString("en-IN") + "–" + lastResult.toLocaleString("en-IN") + " of " + total.toLocaleString("en-IN") + " opportunities" : "Browse the current collection of company career listings."}</p>
            </div>
            <label className={styles.sortField}>
              <span>SORT BY</span>
              <div className={styles.sortControl}>
                <ArrowDownUp size={15} aria-hidden="true" />
                <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
                  <option value="newest">Recently posted</option>
                  <option value="company">Company name</option>
                  <option value="title">Job title</option>
                </select>
              </div>
            </label>
          </div>

          {error && <div className={styles.error} role="alert">{error}</div>}

          {loading ? (
            <div className={styles.jobGrid} aria-label="Loading jobs">
              {Array.from({ length: 4 }).map((_, index) => <div className={styles.skeleton} key={index} />)}
            </div>
          ) : jobs.length > 0 ? (
            <div className={styles.jobGrid}>
              {jobs.map((job) => {
                const company = cleanText(job.company) || "Company not listed";
                const originalUrl = safeJobUrl(job.applyUrl) || safeJobUrl(job.url);
                const description = cleanText(job.description);
                return (
                  <article className={styles.jobCard} key={job.id}>
                    <div className={styles.jobCardTop}>
                      <div className={styles.companyIdentity}>
                        <span className={styles.companyMark}>{company.slice(0, 1).toUpperCase()}</span>
                        <span className={styles.companyDetails}><strong>{company}</strong><small>{providerLabel(job.provider)}</small></span>
                      </div>
                      <span className={styles.openStatus}><span /> OPEN</span>
                    </div>

                    <h3>{cleanText(job.title) || "Untitled role"}</h3>

                    <div className={styles.jobMeta}>
                      <span><MapPin size={14} />{cleanText(job.location) || (job.remote ? "Remote" : "Location not provided")}</span>
                      {job.remote && <span><span className={styles.remoteDot} /> Remote</span>}
                    </div>

                    {description && <p className={styles.description}>{description.slice(0, 240)}{description.length > 240 ? "…" : ""}</p>}

                    <div className={styles.jobCardFooter}>
                      <span className={styles.postedDate}><Clock3 size={13} /> Updated {formatPostedDate(job.postedAt || job.firstSeen)}</span>
                      {originalUrl ? <a href={originalUrl} target="_blank" rel="noopener noreferrer">View job <ExternalLink size={14} /></a> : <span className={styles.noLink}>Source link unavailable</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : !error ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><BriefcaseBusiness size={22} /></span>
              <span className={styles.sectionKicker}>{activeFilterCount ? "NO MATCHES" : "JOB INDEX"}</span>
              <h3>{activeFilterCount ? "No roles match these filters" : "The job index is empty right now"}</h3>
              <p>{activeFilterCount ? "Try a broader keyword or remove one of the filters to see more opportunities." : "There are no open listings in the index yet. New company listings will appear here after the crawler collects them."}</p>
              {activeFilterCount > 0 && <button type="button" onClick={clearFilters}><X size={14} /> Clear filters</button>}
            </div>
          ) : null}

          <nav className={styles.pagination} aria-label="Job listing pages">
            <span>{total > 0 ? "Showing " + firstResult + "–" + lastResult + " · Page " + page + " of " + pageCount : "No pages to display"}</span>
            <div>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={loading || page <= 1}><ChevronLeft size={15} /> Previous</button>
              <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={loading || page >= pageCount || total === 0}>Next <ChevronRight size={15} /></button>
            </div>
          </nav>
        </section>
      </div>
    </main>
  );
}

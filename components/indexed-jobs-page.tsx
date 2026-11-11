"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BriefcaseBusiness, Building2, ChevronLeft, ChevronRight, ExternalLink, MapPin, Search, SlidersHorizontal, X } from "lucide-react";
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

const emptyFilters: Filters = { query: "", location: "", company: "", provider: "", remote: "" };
const pageSize = 24;

function cleanText(value?: string | null) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/\\s+/g, " ").trim();
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
    boards: "Company career pages",
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
    <main className={`${styles.page} indexed-jobs-page`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}><BriefcaseBusiness size={14} /> NVOIDAI JOB INDEX</span>
          <h1>All open jobs</h1>
          <p>Browse every open opportunity currently collected in Nvoid Engine. Refine the index by role, location, company, source or work mode.</p>
        </div>
        <div className={styles.totalCard}>
          <strong>{total.toLocaleString("en-IN")}</strong>
          <span>open indexed jobs</span>
        </div>
      </header>

      <div className={styles.mobileFilterBar}>
        <button type="button" onClick={() => setMobileFiltersOpen((open) => !open)} aria-expanded={mobileFiltersOpen}>
          <SlidersHorizontal size={16} /> Filters{activeFilterCount ? ` · ${activeFilterCount}` : ""}
        </button>
        <span>{total.toLocaleString("en-IN")} jobs</span>
      </div>

      <div className={styles.browser}>
        <aside className={`${styles.filterPanel} ${mobileFiltersOpen ? styles.filterPanelOpen : ""}`}>
          <form onSubmit={submitFilters}>
            <div className={styles.filterHeading}>
              <span><SlidersHorizontal size={16} /> Filters</span>
              <button type="button" onClick={clearFilters}>Clear all</button>
            </div>

            <label className={styles.field}>
              <span>Role, skill or keyword</span>
              <div className={styles.inputWrap}><Search size={16} /><input value={draft.query} onChange={(event) => updateDraft("query", event.target.value)} placeholder="Java developer, React…" /></div>
            </label>

            <label className={styles.field}>
              <span>Location</span>
              <div className={styles.inputWrap}><MapPin size={16} /><input value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} placeholder="City, state or country" /></div>
            </label>

            <label className={styles.field}>
              <span>Company</span>
              <div className={styles.inputWrap}><Building2 size={16} /><input value={draft.company} onChange={(event) => updateDraft("company", event.target.value)} placeholder="Company name" /></div>
            </label>

            <label className={styles.field}>
              <span>Job source</span>
              <select value={draft.provider} onChange={(event) => updateDraft("provider", event.target.value)}>
                <option value="">All sources</option>
                {providers.filter((item) => item.id).map((item) => (
                  <option key={item.id} value={item.id}>{providerLabel(item.id)} ({item.count.toLocaleString("en-IN")})</option>
                ))}
              </select>
            </label>

            <label className={styles.field}>
              <span>Work mode</span>
              <select value={draft.remote} onChange={(event) => updateDraft("remote", event.target.value)}>
                <option value="">Any work mode</option>
                <option value="true">Remote</option>
                <option value="false">On-site / hybrid / unspecified</option>
              </select>
            </label>

            <button className={styles.applyFilters} type="submit"><Search size={15} /> Apply filters</button>
          </form>
        </aside>

        <section className={styles.results}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsSummary}>
              <span className={styles.resultsEyebrow}>INDEXED OPPORTUNITIES</span>
              <h2>{total.toLocaleString("en-IN")} open listings</h2>
              <p>{loading ? "Loading the Nvoid job index…" : total > 0 ? `Showing ${firstResult.toLocaleString("en-IN")}–${lastResult.toLocaleString("en-IN")} of ${total.toLocaleString("en-IN")} indexed jobs.` : "No indexed jobs match the current filters."}</p>
            </div>
            <label className={styles.sortField}>
              <span>Sort by</span>
              <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
                <option value="newest">Recently posted</option>
                <option value="company">Company name</option>
                <option value="title">Job title</option>
              </select>
            </label>
          </div>

          {error && <div className={styles.error} role="alert">{error}</div>}

          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 6 }).map((_, index) => <div className={styles.skeleton} key={index} />)}
            </div>
          ) : jobs.length > 0 ? (
            <div className={styles.grid}>
              {jobs.map((job) => {
                const company = cleanText(job.company) || "Company not listed";
                const originalUrl = safeJobUrl(job.applyUrl) || safeJobUrl(job.url);
                const description = cleanText(job.description);
                return (
                  <article className={styles.card} key={job.id}>
                    <div className={styles.cardTop}>
                      <span className={styles.companyMark}>{company.slice(0, 1).toUpperCase()}</span>
                      <span className={styles.provider}>{providerLabel(job.provider)}</span>
                    </div>
                    <h3>{cleanText(job.title) || "Untitled role"}</h3>
                    <p className={styles.company}>{company}</p>
                    <div className={styles.meta}>
                      <span><MapPin size={13} />{cleanText(job.location) || (job.remote ? "Remote" : "Location not provided")}</span>
                      {job.remote && <span className={styles.remote}>Remote</span>}
                    </div>
                    {job.salary && <p className={styles.salary}>{cleanText(job.salary)}</p>}
                    {description && <p className={styles.description}>{description.slice(0, 240)}{description.length > 240 ? "…" : ""}</p>}
                    <div className={styles.cardFooter}>
                      <span>Updated {formatPostedDate(job.postedAt || job.firstSeen)}</span>
                      {originalUrl ? <a href={originalUrl} target="_blank" rel="noopener noreferrer">View original job <ExternalLink size={13} /></a> : <span className={styles.noLink}>No source URL</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : !error ? (
            <div className={styles.empty}>
              <span><Search size={20} /></span>
              <strong>{activeFilterCount ? "No matching jobs found" : "No open indexed jobs yet"}</strong>
              <p>{activeFilterCount ? "Try removing a filter or broadening your search terms." : "The company-board crawler has not populated the open-job index yet."}</p>
              {activeFilterCount > 0 && <button type="button" onClick={clearFilters}><X size={14} /> Clear filters</button>}
            </div>
          ) : null}

          <nav className={styles.pagination} aria-label="Job listing pages">
            <span>{total > 0 ? `Page ${page} of ${pageCount}` : "No pages to show"}</span>
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

"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { BriefcaseBusiness, Building2, ChevronLeft, ChevronRight, ExternalLink, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { useAuth } from "../lib/context/AuthContext";
import { openToWorkApi } from "../lib/api/highlights.api";
import { usersApi } from "../lib/api/profile.api";
import styles from "./indexed-jobs-page.module.css";

type Job = {
  id: string;
  title: string;
  company?: string;
  location?: string;
  url?: string;
  applyUrl?: string;
  description?: string;
  salary?: string;
  remote?: boolean;
  postedAt?: string;
  firstSeen?: string;
  provider?: string;
  source?: string;
  matchScore?: number;
  matchReasons?: string[];
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
  jobs?: Job[];
  error?: string;
  engine?: {
    complete?: boolean;
    cached?: boolean;
    stale?: boolean;
    notes?: string[];
  };
};

const emptyFilters: Filters = {
  query: "",
  location: "",
  company: "",
  provider: "",
  remote: ""
};

const pageSize = 24;

function cleanText(value?: string) {
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

function formatPostedDate(value?: string) {
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
    remotive: "Remotive",
    remoteok: "Remote OK",
    weworkremotely: "We Work Remotely",
    workingnomads: "Working Nomads",
    himalayas: "Himalayas",
    jobicy: "Jobicy",
    themuse: "The Muse",
    arbeitnow: "Arbeitnow",
    arbeitsagentur: "Bundesagentur für Arbeit",
    mycareersfuture: "MyCareersFuture",
    hh: "HeadHunter",
    dou: "DOU Jobs"
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [engineState, setEngineState] = useState<JobsResponse["engine"]>();
  const { user, isLoading: authLoading } = useAuth();
  const [profileReady, setProfileReady] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setDraft((current) => ({ ...current, query: current.query || "Software Developer", location: current.location || "India" }));
      setFilters((current) => ({ ...current, query: current.query || "Software Developer", location: current.location || "India" }));
      setProfileReady(true);
      return;
    }

    let active = true;
    const loadProfileDefaults = async () => {
      const [availability, profile] = await Promise.all([
        openToWorkApi.getByUserId(user.id).catch(() => null),
        user.slug ? usersApi.getUserDetailBySlug(user.slug).catch(() => null) : Promise.resolve(null)
      ]);
      if (!active) return;

      const details = profile as {
        title?: string | null;
        location?: string | null;
        city?: string | null;
        state?: string | null;
        country?: string | null;
      } | null;
      const preferredRole = availability?.jobTitle?.trim() || details?.title?.trim() || "";
      const preferredLocation = [
        details?.city,
        details?.state,
        details?.country
      ].map((value) => value?.trim()).filter(Boolean).join(", ") || details?.location?.trim() || "";
      const initialRole = preferredRole || "Software Developer";
      const initialLocation = preferredLocation || "India";

      setDraft((current) => ({
        ...current,
        query: preferredRole || current.query || initialRole,
        location: preferredLocation || current.location || initialLocation
      }));
      setFilters((current) => ({
        ...current,
        query: preferredRole || current.query || initialRole,
        location: preferredLocation || current.location || initialLocation
      }));
      setProfileReady(true);
    };

    void loadProfileDefaults().catch(() => {
      if (!active) return;
      setDraft((current) => ({ ...current, query: current.query || "Software Developer", location: current.location || "India" }));
      setFilters((current) => ({ ...current, query: current.query || "Software Developer", location: current.location || "India" }));
      setProfileReady(true);
    });

    return () => {
      active = false;
    };
  }, [authLoading, user?.id, user?.slug]);

  const requestQuery = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), limit: String(pageSize), sort });
    if (filters.query) params.set("query", filters.query);
    if (filters.location) params.set("location", filters.location);
    if (filters.company) params.set("company", filters.company);
    if (filters.provider) params.set("provider", filters.provider);
    if (filters.remote) params.set("remote", filters.remote);
    return params.toString();
  }, [filters, page, sort]);

  useEffect(() => {
    if (!profileReady) return;
    if (!filters.query.trim() || !filters.location.trim()) {
      setJobs([]);
      setTotal(0);
      setEngineState(undefined);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError("");

    async function loadJobs() {
      try {
        const response = await fetch("/api/agent/jobs?" + requestQuery, {
          method: "GET",
          cache: "no-store",
          signal: controller.signal
        });
        const payload: unknown = await response.json().catch(() => ({}));
        if (!response.ok) {
          const record = payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
          throw new Error(typeof record.error === "string" ? record.error : "Nvoid Engine could not load matching jobs.");
        }
        const result = payload as JobsResponse;
        setJobs(Array.isArray(result.jobs) ? result.jobs : []);
        setTotal(typeof result.total === "number" ? result.total : 0);
        setEngineState(result.engine);
      } catch (caught) {
        if (controller.signal.aborted) return;
        setJobs([]);
        setTotal(0);
        setEngineState(undefined);
        setError(caught instanceof Error ? caught.message : "The indexed job catalogue could not be loaded.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadJobs();
    return () => controller.abort();
  }, [requestQuery, profileReady, filters.query, filters.location]);

  function updateDraft(key: keyof Filters, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function submitFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setFilters({ ...draft });
  }

  function clearFilters() {
    setDraft(emptyFilters);
    setFilters(emptyFilters);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const firstResult = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastResult = Math.min(page * pageSize, total);

  return (
    <main className={`${styles.page} indexed-jobs-page`}>
      <header className={styles.header}>
        <div className={styles.heading}>
          <span className={styles.eyebrow}><BriefcaseBusiness size={14} /> NVOIDAI JOB INDEX</span>
          <h1>My Jobs</h1>
          <p>Your Open to work role and profile location are prefilled when available. Adjust either field to find matching opportunities from Nvoid Engine.</p>
        </div>
        <div className={styles.totalCard}>
          <strong>{total.toLocaleString("en-IN")}</strong>
          <span>{filters.query || filters.location || filters.company || filters.provider || filters.remote ? "matching open jobs" : "open jobs in the index"}</span>
        </div>
      </header>

      <form className={styles.filters} onSubmit={submitFilters}>
        <div className={styles.filterHeading}>
          <span><SlidersHorizontal size={15} /> Filter listings</span>
          <button type="button" onClick={clearFilters}>Clear filters</button>
        </div>
        <div className={styles.filterGrid}>
          <label className={styles.field}>
            <span>Role or skill</span>
            <div className={styles.inputWrap}><Search size={16} /><input required aria-label="Job title or skill" title={draft.query} autoComplete="off" spellCheck={false} value={draft.query} onChange={(event) => updateDraft("query", event.target.value)} placeholder="e.g. Java Developer" /></div>
          </label>
          <label className={styles.field}>
            <span>Location</span>
            <div className={styles.inputWrap}><MapPin size={16} /><input required aria-label="Job location" title={draft.location} autoComplete="off" spellCheck={false} value={draft.location} onChange={(event) => updateDraft("location", event.target.value)} placeholder="City, state or country" /></div>
          </label>
          <label className={styles.field}>
            <span>Company</span>
            <div className={styles.inputWrap}><Building2 size={16} /><input value={draft.company} onChange={(event) => updateDraft("company", event.target.value)} placeholder="Company name" /></div>
          </label>
          <label className={styles.field}>
            <span>Job source</span>
            <select value={draft.provider} onChange={(event) => updateDraft("provider", event.target.value)}>
              <option value="">All providers</option>
              <option value="boards">Company career pages</option>
              <option value="web">Public web search</option>
              <option value="remotive">Remotive</option>
              <option value="remoteok">Remote OK</option>
              <option value="weworkremotely">We Work Remotely</option>
              <option value="workingnomads">Working Nomads</option>
              <option value="himalayas">Himalayas</option>
              <option value="jobicy">Jobicy</option>
              <option value="themuse">The Muse</option>
              <option value="arbeitnow">Arbeitnow</option>
              <option value="arbeitsagentur">Bundesagentur für Arbeit</option>
              <option value="mycareersfuture">MyCareersFuture</option>
              <option value="hh">HeadHunter</option>
              <option value="dou">DOU Jobs</option>
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
          <button className={styles.applyFilters} type="submit">Apply filters <Search size={15} /></button>
        </div>
      </form>

      <section className={styles.results}>
        <div className={styles.resultsHeader}>
          <div>
            <span className={styles.resultsEyebrow}>INDEXED OPPORTUNITIES</span>
            <h2>{total.toLocaleString("en-IN")} open listings</h2>
            <p>{!profileReady ? "Loading your job preferences…" : loading ? "Searching Nvoid Engine…" : total > 0 ? "Showing " + firstResult.toLocaleString("en-IN") + "–" + lastResult.toLocaleString("en-IN") + " of " + total.toLocaleString("en-IN") + " matching jobs." + (engineState?.stale ? " Showing the last available cached results." : engineState?.complete === false ? " More source results may still be loading." : "") : engineState?.notes?.length ? engineState.notes.join(" ") : "No listings match the current filters."}</p>
          </div>
          <label className={styles.sortField}>
            <span>Sort by</span>
            <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}>
              <option value="newest">Recently posted / updated</option>
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
                  {typeof job.matchScore === "number" && <p className={styles.salary}>{Math.round(job.matchScore)}% Nvoid relevance{job.matchReasons?.length ? " · " + job.matchReasons.join(" · ") : ""}</p>}
                  {description && <p className={styles.description}>{description.slice(0, 220)}{description.length > 220 ? "…" : ""}</p>}
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
            <strong>{filters.query.trim() && filters.location.trim() ? "No matching jobs found" : "Set your role and location"}</strong>
            <p>{filters.query.trim() && filters.location.trim() ? "Try a broader title or nearby location, or adjust the filters above." : "Enter the role you want and your preferred city or country, then apply the filters to search Nvoid Engine."}</p>
            {filters.query.trim() && filters.location.trim() && <button type="button" onClick={clearFilters}>Clear filters</button>}
          </div>
        ) : null}

        <nav className={styles.pagination} aria-label="Job listing pages">
          <span>{total > 0 ? "Page " + page + " of " + pageCount : "No pages to show"}</span>
          <div>
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={loading || page <= 1}><ChevronLeft size={15} /> Previous</button>
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={loading || page >= pageCount || total === 0}>Next <ChevronRight size={15} /></button>
          </div>
        </nav>
      </section>
    </main>
  );
}

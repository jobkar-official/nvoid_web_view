"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Asterisk, BriefcaseBusiness, Clock3, ExternalLink, LoaderCircle, MapPin, Search, ShieldCheck, Target, X } from "lucide-react";
import { useGuestHistory, type GuestSearchJob } from "./guest-shell";

type Job = GuestSearchJob;
type SourceDiagnostic = {
  serverId: string;
  tool?: string;
  found?: number;
  fetchedCount?: number;
  normalizedCount?: number;
  roleMatchedCount?: number;
  locationMatchedCount?: number;
  connectionStatus: string;
  error?: string;
  skipReason?: string;
};
type SearchOrchestration = {
  connectedMcpServers?: number;
  connectedSearchTools?: number;
  executedSearchTools?: number;
  queryPlanner?: string;
};
type SearchTimings = {
  titlePlanning?: number;
  sourceSearch?: number;
  detailEnrichment?: number;
  aiReranking?: number;
  total?: number;
};

function formatDuration(milliseconds?: number) {
  if (typeof milliseconds !== "number" || !Number.isFinite(milliseconds)) return "";
  return milliseconds >= 1000 ? (milliseconds / 1000).toFixed(1) + "s" : milliseconds + "ms";
}

function clean(value?: string) {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim() : "";
}

function postedDate(value?: string) {
  if (!value) return "Date not provided";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(date) : value;
}

function sourceName(value?: string) {
  const names: Record<string, string> = {
    jobicy: "Jobicy", remoteok: "Remote OK", arbeitnow: "Arbeitnow", workingnomads: "Working Nomads",
    himalayas: "Himalayas", naukri: "Naukri", linkedin: "LinkedIn Jobs", indeed: "Indeed",
    glassdoor: "Glassdoor", apna: "Apna", adzuna: "Adzuna", jooble: "Jooble",
    greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby", "serper-search": "Public web search",
    jobspy: "JobSpy", "openings-mcp": "Openings MCP"
  };
  return names[value || ""] || value || "Connected source";
}

async function responseData(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = typeof payload.error === "string" ? payload.error : "The job search could not be completed.";
    const detail = typeof payload.detail === "string" ? payload.detail : "";
    const hint = typeof payload.hint === "string" ? payload.hint : "";
    const code = typeof payload.code === "string" ? payload.code : "";
    throw new Error([message, detail, code ? "(" + code + ")" : "", hint].filter(Boolean).join(" "));
  }
  return payload;
}

function cachedJobs(jobs: Job[]): Job[] {
  return jobs.filter((job): job is Job => Boolean(job && typeof job === "object")).slice(0, 1000).map((job, index) => ({
    id: clean(job.id).slice(0, 180) || `saved-job-${index + 1}`,
    title: clean(job.title).slice(0, 180) || "Untitled opportunity",
    company: clean(job.company).slice(0, 140) || undefined,
    location: clean(job.location).slice(0, 140) || undefined,
    country: clean(job.country).slice(0, 80) || undefined,
    description: clean(job.description).slice(0, 420) || undefined,
    jobUrl: clean(job.jobUrl).slice(0, 1200) || undefined,
    applicationUrl: clean(job.applicationUrl).slice(0, 1200) || undefined,
    employmentType: clean(job.employmentType).slice(0, 80) || undefined,
    workMode: clean(job.workMode).slice(0, 80) || undefined,
    postedAt: clean(job.postedAt).slice(0, 80) || undefined,
    experience: clean(job.experience).slice(0, 100) || undefined,
    salary: clean(job.salary).slice(0, 100) || undefined,
    matchScore: typeof job.matchScore === "number" && Number.isFinite(job.matchScore) ? job.matchScore : undefined,
    matchReasons: Array.isArray(job.matchReasons) ? job.matchReasons.slice(0, 4).map((reason) => clean(reason).slice(0, 160)) : undefined,
    source: clean(job.source).slice(0, 80) || undefined
  })).filter((job) => job.title !== "Untitled opportunity" || Boolean(job.jobUrl || job.applicationUrl));
}

export default function GuestHome({ searchId, initialJobTitle = "", initialLocation = "Worldwide", autoSearch = false }: { searchId?: string; initialJobTitle?: string; initialLocation?: string; autoSearch?: boolean }) {
  const { saveSearch, updateSearch, getSearch } = useGuestHistory();
  const autoSearchKey = useRef("");
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [location, setLocation] = useState(initialLocation || "Worldwide");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<SourceDiagnostic[]>([]);
  const [orchestration, setOrchestration] = useState<SearchOrchestration | null>(null);
  const [searchTimings, setSearchTimings] = useState<SearchTimings | null>(null);
  const [sourceActivityIssue, setSourceActivityIssue] = useState("");
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortMode, setSortMode] = useState<"relevance" | "newest" | "title">("relevance");
  const displayedJobs = useMemo(() => jobs.map((job, index) => ({ job, index })).sort((left, right) => {
    if (sortMode === "newest") {
      const leftDate = Date.parse(left.job.postedAt || "") || 0;
      const rightDate = Date.parse(right.job.postedAt || "") || 0;
      return rightDate - leftDate || left.index - right.index;
    }
    if (sortMode === "title") return left.job.title.localeCompare(right.job.title) || left.index - right.index;
    return (right.job.matchScore ?? -1) - (left.job.matchScore ?? -1) || left.index - right.index;
  }).map((item) => item.job), [jobs, sortMode]);

  useEffect(() => {
    if (!searchId) {
      setJobTitle(initialJobTitle);
      setLocation(initialLocation || "Worldwide");
      setJobs([]);
      setSources([]);
      setOrchestration(null);
      setSearchTimings(null);
      setSourceActivityIssue("");
      setSearched(false);
      setActiveSearch("");
      setNotice("");
      return;
    }

    const saved = getSearch(searchId);
    if (!saved) {
      setJobTitle("");
      setLocation("Worldwide");
      setJobs([]);
      setSources([]);
      setOrchestration(null);
      setSearched(false);
      setActiveSearch("");
      setNotice("This saved search is not available in this browser. Start a new search to continue.");
      return;
    }

    const savedJobs = Array.isArray(saved.jobs) ? saved.jobs : [];
    setJobTitle(saved.jobTitle);
    setLocation(saved.location);
    setJobs(savedJobs);
    setSources(Array.isArray(saved.sources) ? saved.sources as SourceDiagnostic[] : []);
    setOrchestration(saved.orchestration ? saved.orchestration as SearchOrchestration : null);
    setSearchTimings(saved.timingsMs ? saved.timingsMs as SearchTimings : null);
    setSourceActivityIssue(!saved.sources?.length && !saved.orchestration && Array.isArray(saved.jobs)
      ? "This saved search does not contain source-level execution details. Run it again to inspect which providers were queried."
      : "");
    setSearched(Array.isArray(saved.jobs));
    setActiveSearch(saved.id);
    setNotice(saved.error || (Array.isArray(saved.jobs)
      ? savedJobs.length
        ? `${saved.resultCount ?? savedJobs.length} saved opportunities restored for ${saved.jobTitle} in ${saved.location}.`
        : "This search is saved, but no matching job records were returned."
      : "Search details restored. Run it again to retrieve current job records."));
  }, [searchId, getSearch, initialJobTitle, initialLocation]);

  const runSearch = useCallback(async (
    event?: FormEvent,
    values?: { jobTitle: string; location: string; forceNewRecord?: boolean }
  ) => {
    event?.preventDefault();
    const role = (values?.jobTitle ?? jobTitle).trim();
    const place = (values?.location ?? location).trim();
    if (!role || !place) {
      setNotice("Enter a job title and location to search.");
      return;
    }

    setBusy(true);
    setNotice("");
    setJobs([]);
    setSources([]);
    setOrchestration(null);
    setSearchTimings(null);
    setSourceActivityIssue("");
    setSearched(false);
    const recordId = values?.forceNewRecord
      ? saveSearch({ jobTitle: role, location: place, resultCount: 0 })
      : activeSearch || saveSearch({ jobTitle: role, location: place, resultCount: 0 });
    setActiveSearch(recordId);
    updateSearch(recordId, { jobTitle: role, location: place, resultCount: 0, jobs: [], error: undefined });

    try {
      const profile = {
        userId: "guest-public-search",
        fullName: "Guest",
        firstName: "Guest",
        lastName: "",
        email: "",
        phone: "",
        jobTitle: role,
        location: place,
        countries: place.toLowerCase() === "worldwide" ? [] : [place],
        skills: [],
        keywords: [role],
        experienceYears: 0,
        salaryMin: 0,
        salaryCurrency: "INR",
        employmentTypes: /intern|internship/i.test(role) ? ["internship"] : /part[ -]?time/i.test(role) ? ["part-time"] : ["full-time"],
        remote: false,
        summary: "",
        linkedinUrl: "",
        portfolioUrl: "",
        resumePath: ""
      };
      const result = await responseData(await fetch("/api/agent/search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, limit: 1000, syncToBackend: false })
      }));
      const found = Array.isArray(result.jobs) ? result.jobs as Job[] : [];
      const savedJobs = cachedJobs(found);
      const sourceRows = Array.isArray(result.sources) ? result.sources as SourceDiagnostic[] : [];
      const searchSummary = result.orchestration && typeof result.orchestration === "object" ? result.orchestration as SearchOrchestration : null;
      setJobs(savedJobs);
      setSources(sourceRows);
      setOrchestration(searchSummary);
      const timings = result.timingsMs && typeof result.timingsMs === "object" ? result.timingsMs as SearchTimings : null;
      setSearchTimings(timings);
      setSourceActivityIssue(sourceRows.length === 0 && !searchSummary
        ? "The agent returned no source activity data. Check that the deployed Nvoid worker is running the current search API."
        : sourceRows.length === 0
          ? "The worker completed the request but reported no eligible MCP job-search sources for this query."
          : "");
      setSearched(true);
      updateSearch(recordId, { resultCount: savedJobs.length, jobs: savedJobs, sources: sourceRows, orchestration: searchSummary || undefined, timingsMs: timings || undefined, error: undefined });
      setNotice(savedJobs.length ? savedJobs.length.toLocaleString() + " opportunities found across connected sources." : "No matching opportunities returned. Try a broader job title or location.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nvoid could not complete this search. Please try again.";
      setSearched(true);
      setSourceActivityIssue(message);
      setSearchTimings(null);
      setNotice(message);
      updateSearch(recordId, { resultCount: 0, jobs: [], sources: [], orchestration: undefined, error: message });
    } finally {
      setBusy(false);
    }
  }, [activeSearch, jobTitle, location, saveSearch, updateSearch]);

  useEffect(() => {
    const role = initialJobTitle.trim();
    const place = initialLocation.trim() || "Worldwide";
    if (!autoSearch || !role) {
      autoSearchKey.current = "";
      return;
    }

    const key = `${role.toLocaleLowerCase()}::${place.toLocaleLowerCase()}`;
    if (autoSearchKey.current === key) return;
    autoSearchKey.current = key;
    setJobTitle(role);
    setLocation(place);
    setActiveSearch("");
    void runSearch(undefined, { jobTitle: role, location: place, forceNewRecord: true });
  }, [autoSearch, initialJobTitle, initialLocation, runSearch]);

  return (
    <div className="worker-results-page">
      <section className="worker-results-header">
        <div className="worker-results-heading">
          <span className="worker-results-eyebrow"><Asterisk size={13} /> NVOID SEARCH</span>
          <h1>{searchId ? "Saved search" : "Explore opportunities"}</h1>
          <p>Search across connected job boards and company career pages. Review each opportunity and choose where to apply.</p>
        </div>

        <form id="job-search" className="worker-results-search" onSubmit={runSearch}>
          <label className="worker-results-field" htmlFor="public-role">
            <span>ROLE, SKILL OR KEYWORD</span>
            <span><Search size={17} /><input id="public-role" value={jobTitle} onChange={(event) => { setJobTitle(event.target.value); setActiveSearch(""); }} placeholder="e.g. Product Designer, Java Developer" autoComplete="off" required /></span>
          </label>
          <span className="worker-results-divider" aria-hidden="true" />
          <label className="worker-results-field" htmlFor="public-location">
            <span>LOCATION</span>
            <span><MapPin size={17} /><input id="public-location" value={location} onChange={(event) => { setLocation(event.target.value); setActiveSearch(""); }} placeholder="City, country or Remote" autoComplete="off" required /></span>
          </label>
          <button className="worker-results-submit" type="submit" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}
            {busy ? "Searching" : "Search jobs"}
            {!busy && <ArrowRight size={15} />}
          </button>
        </form>
        <div className="worker-results-trust"><ShieldCheck size={14} /> No account required. Your searches stay in this browser.</div>
      </section>

      {busy && <div className="worker-search-progress" role="status" aria-live="polite"><LoaderCircle className="spin" size={16} /> Searching connected job sources for {jobTitle} in {location}…</div>}
      {notice && <div className={"search-notice" + (searched && !jobs.length ? " muted" : "")} role="status" aria-live="polite"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={15} /></button></div>}

      {!searched && !busy && !searchId && (
        <section className="worker-search-guide" aria-label="How Nvoid search works">
          <div><span>01</span><strong>Search by role and location</strong><p>Describe the opportunity you want to find.</p></div>
          <div><span>02</span><strong>Compare available results</strong><p>Review the details returned by connected sources.</p></div>
          <div><span>03</span><strong>Choose your next step</strong><p>Open the original listing and apply on the destination provided.</p></div>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="public-results-section">
          <div className="section-heading">
            <div><span className="section-kicker">{searchId ? "SAVED SEARCH RESULTS" : "LIVE SEARCH RESULTS"}</span><h2>Opportunities for {jobTitle}</h2><p>{searchId ? `Restored from your saved search in ${location}.` : "Results are returned by the sources currently connected to Nvoid."}</p></div>
            <span className="result-count">{jobs.length.toLocaleString()} found</span>
          </div>
          <div className="worker-results-toolbar">
            <div className="worker-results-result-context"><strong>{jobs.length.toLocaleString()} opportunities</strong><span>Review the source details and choose where to apply.</span></div>
            <label className="worker-results-sort"><span>Sort results</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as "relevance" | "newest" | "title")}><option value="relevance">Nvoid relevance</option><option value="newest">Newest first</option><option value="title">Job title</option></select></label>
          </div>
          <div className="public-job-grid">
            {displayedJobs.map((job, index) => {
              const company = job.company || "Company not listed";
              const locationText = job.location || job.country || "Location not provided";
              const listing = job.jobUrl || job.applicationUrl;
              const apply = job.applicationUrl && job.applicationUrl !== job.jobUrl ? job.applicationUrl : listing;
              return (
                <article className="public-job-card" key={job.id || (job.title + company + index)}>
                  <div className="public-job-card-top">
                    <div className="company-monogram">{company.slice(0, 1).toUpperCase()}</div>
                    <span className="source-chip">{sourceName(job.source)}</span>
                  </div>
                  <h3>{job.title}</h3>
                  <p className="public-job-company">{company}</p>
                  <div className="public-job-meta"><span><MapPin size={13} />{locationText}</span>{job.employmentType && <span><BriefcaseBusiness size={13} />{job.employmentType}</span>}</div>
                  <p className="public-job-description">{clean(job.description) || "Open the original listing for the full job description and requirements."}</p>
                  {job.matchReasons && job.matchReasons.length > 0 && <div className="worker-match-reasons">{job.matchReasons.slice(0, 3).map((reason) => <span key={reason}>{reason}</span>)}</div>}
                  <div className="public-job-details">
                    {job.experience && <span>{job.experience}</span>}
                    {job.workMode && <span>{job.workMode}</span>}
                    {job.salary && <span>{job.salary}</span>}
                    {job.postedAt && <span><Clock3 size={11} />{postedDate(job.postedAt)}</span>}
                  </div>
                  <div className="public-job-footer">
                    {typeof job.matchScore === "number" ? <span className="match-label"><Target size={12} /> {Math.round(job.matchScore)}% profile fit</span> : <span className="external-label">External opportunity</span>}
                    {apply ? <a href={apply} target="_blank" rel="noreferrer">View opportunity <ExternalLink size={13} /></a> : listing ? <a href={listing} target="_blank" rel="noreferrer">Original listing <ExternalLink size={13} /></a> : <span className="external-label">Source link unavailable</span>}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {searched && jobs.length === 0 && (
        <section className="no-results">
          <div className="no-results-icon"><Search size={21} /></div>
          <h2>No matching jobs returned</h2>
          <p>Try another role or location. Nvoid only displays opportunities returned by its connected sources; it doesn't generate sample listings.</p>
        </section>
      )}


    </div>
  );
}

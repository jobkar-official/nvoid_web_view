"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Asterisk, BriefcaseBusiness, Clock3, ExternalLink, LoaderCircle, MapPin, Search, ShieldCheck, Target, X } from "lucide-react";
import { useGuestHistory, type GuestSearchJob } from "./guest-shell";
import { useAuth } from "../lib/context/AuthContext";
import { buildTrackedApplicationUrl } from "../lib/application-url";

type Job = GuestSearchJob;
type SourceDiagnostic = {
  serverId: string;
  tool?: string;
  found?: number;
  fetchedCount?: number;
  normalizedCount?: number;
  roleMatchedCount?: number;
  locationMatchedCount?: number;
  detailsRequested?: number;
  detailsFetched?: number;
  detailTool?: string;
  connectionStatus: string;
  error?: string;
  skipReason?: string;
};
type CrawlPageReport = {
  url: string;
  status: string;
  httpStatus?: number;
  pageTitle?: string;
  canonicalUrl?: string;
  extractionMethod?: string;
  fieldsExtracted?: string[];
  missingFields?: string[];
  availabilityStatus?: string;
  reason?: string;
  durationMs?: number;
  discoveredFrom?: string;
  searchQuery?: string;
};

type CrawlReport = {
  role?: string;
  location?: string;
  depth?: "standard" | "deep";
  jobBoardSitesTargeted?: string[];
  searchEnginesUsed?: string[];
  totalFound?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
  hasMore?: boolean;
  sourceSummary?: Array<{ source: string; count: number }>;
  searchPagesFetched?: number;
  crawlPagesAttempted?: number;
  crawlPagesMatched?: number;
  crawlStatusCounts?: Record<string, number>;
  pageReports?: CrawlPageReport[];
  pageReportsTotal?: number;
  pageReportsTruncated?: boolean;
  note?: string;
};
type SearchTimings = {
  titlePlanning?: number;
  sourceSearch?: number;
  detailEnrichment?: number;
  aiReranking?: number;
  discovery?: number;
  crawl?: number;
  total?: number;
};

function formatDuration(milliseconds?: number) {
  if (typeof milliseconds !== "number" || !Number.isFinite(milliseconds)) return "";
  return milliseconds >= 1000 ? (milliseconds / 1000).toFixed(1) + "s" : milliseconds + "ms";
}

function clean(value?: string | number) {
  const text = typeof value === "string" || typeof value === "number" ? String(value) : "";
  return text.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
}

function postedTimestamp(value?: string | number) {
  if (value === undefined || value === null) return 0;
  const raw = String(value).trim();
  if (/^\d{9,13}$/.test(raw)) {
    const numeric = Number(raw);
    const date = new Date(numeric < 1_000_000_000_000 ? numeric * 1000 : numeric);
    return Number.isFinite(date.getTime()) ? date.getTime() : 0;
  }
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function postedDate(value?: string | number) {
  if (value === undefined || value === null || value === "") return "Date not provided";
  const timestamp = postedTimestamp(value);
  if (!timestamp) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(new Date(timestamp));
}

function sourceName(value?: string) {
  const names: Record<string, string> = {
    "public-web-crawler": "Nvoid Web Crawler",
    jobicy: "Jobicy", remoteok: "Remote OK", arbeitnow: "Arbeitnow", workingnomads: "Working Nomads",
    himalayas: "Himalayas", naukri: "Naukri", linkedin: "LinkedIn Jobs", indeed: "Indeed",
    glassdoor: "Glassdoor", apna: "Apna", adzuna: "Adzuna", jooble: "Jooble",
    greenhouse: "Greenhouse", lever: "Lever", ashby: "Ashby", "serper-search": "Public web search",
    jobspy: "JobSpy", "mcp-jobspy-speedyapply": "JobSpy", "openings-mcp": "Openings MCP",
    jobdatalake: "JobDataLake", aidevboard: "AI Dev Jobs", weworkremotely: "We Work Remotely",
    metaintro: "MetaIntro", jobsbylevel: "JobsByLevel", jobyap: "JobYap", youth4work: "Youth4work", "jobspipe-demo": "JobsPipe"
  };
  return names[value || ""] || value || "Public job site";
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
    sourceUrl: clean(job.sourceUrl).slice(0, 1200) || undefined,
    applicationUrl: clean(job.applicationUrl).slice(0, 1200) || undefined,
    employmentType: clean(job.employmentType).slice(0, 80) || undefined,
    workMode: clean(job.workMode).slice(0, 80) || undefined,
    postedAt: clean(job.postedAt).slice(0, 80) || undefined,
    experience: clean(job.experience).slice(0, 100) || undefined,
    noticePeriod: clean(job.noticePeriod).slice(0, 100) || undefined,
    availabilityStatus: clean(job.availabilityStatus).slice(0, 100) || undefined,
    isOpen: typeof job.isOpen === "boolean" ? job.isOpen : undefined,
    salary: clean(job.salary).slice(0, 100) || undefined,
    matchScore: typeof job.matchScore === "number" && Number.isFinite(job.matchScore) ? job.matchScore : undefined,
    matchReasons: Array.isArray(job.matchReasons) ? job.matchReasons.slice(0, 4).map((reason) => clean(reason).slice(0, 160)) : undefined,
    source: clean(job.source).slice(0, 80) || undefined
  })).filter((job) => job.title !== "Untitled opportunity" || Boolean(job.jobUrl || job.applicationUrl));
}

export default function GuestHome({ searchId, initialJobTitle = "", initialLocation = "Worldwide", autoSearch = false }: { searchId?: string; initialJobTitle?: string; initialLocation?: string; autoSearch?: boolean }) {
  const { saveSearch, updateSearch, getSearch } = useGuestHistory();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const autoSearchKey = useRef("");
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [location, setLocation] = useState(initialLocation || "Worldwide");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<SourceDiagnostic[]>([]);
  const [searchReport, setSearchReport] = useState<CrawlReport | null>(null);
  const [searchTimings, setSearchTimings] = useState<SearchTimings | null>(null);
  const [visibleJobCount, setVisibleJobCount] = useState(100);
  const [sourceActivityIssue, setSourceActivityIssue] = useState("");
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [sortMode, setSortMode] = useState<"relevance" | "newest" | "title">("relevance");
  const displayedJobs = useMemo(() => jobs.map((job, index) => ({ job, index })).sort((left, right) => {
    if (sortMode === "newest") {
      const leftDate = postedTimestamp(left.job.postedAt);
      const rightDate = postedTimestamp(right.job.postedAt);
      return rightDate - leftDate || left.index - right.index;
    }
    if (sortMode === "title") return left.job.title.localeCompare(right.job.title) || left.index - right.index;
    return (right.job.matchScore ?? -1) - (left.job.matchScore ?? -1) || left.index - right.index;
  }).map((item) => item.job).slice(0, visibleJobCount), [jobs, sortMode, visibleJobCount]);

  useEffect(() => {
    if (!searchId) {
      setJobTitle(initialJobTitle);
      setLocation(initialLocation || "Worldwide");
      setJobs([]);
      setSources([]);
      setSearchReport(null);
      setSearchTimings(null);
      setSourceActivityIssue("");
      setVisibleJobCount(100);
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
      setSearchReport(null);
      setSearchTimings(null);
      setSourceActivityIssue("");
      setVisibleJobCount(100);
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
    setSearchReport(saved.report ? saved.report as CrawlReport : saved.orchestration ? saved.orchestration as CrawlReport : null);
    setSearchTimings(saved.timingsMs ? saved.timingsMs as SearchTimings : null);
    setVisibleJobCount(100);
    setSourceActivityIssue(!saved.sources?.length && !saved.report && !saved.orchestration && Array.isArray(saved.jobs)
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

  const openApplication = useCallback((value: string, source?: string) => {
    if (authLoading) {
      setNotice("Checking your account. Please try Apply Now again in a moment.");
      return;
    }

    const destination = buildTrackedApplicationUrl(value, source);
    if (!destination) {
      setNotice("This job source did not provide a valid application URL.");
      return;
    }

    if (isAuthenticated) {
      const opened = window.open(destination, "_blank");
      if (!opened) {
        setNotice("Allow pop-ups for NVOIDAI to open the job application in a new tab.");
        return;
      }
      opened.opener = null;
      return;
    }

    const waitingTab = window.open(
      "/auth/apply-redirect?destination=" + encodeURIComponent(destination),
      "_blank"
    );
    if (!waitingTab) {
      setNotice("Allow pop-ups for NVOIDAI, then select Apply Now again to continue to the job after signing in.");
      return;
    }

    window.location.assign("/auth/signin?applyUrl=" + encodeURIComponent(destination));
  }, [authLoading, isAuthenticated]);

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
    setSearchReport(null);
    setSearchTimings(null);
    setSourceActivityIssue("");
    setVisibleJobCount(100);
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
      const result = await responseData(await fetch("/api/agent/crawl", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile, limit: 1000, page: 1, pageSize: 100, depth: "deep", syncToBackend: false })
      }));
      const found = Array.isArray(result.jobs) ? result.jobs as Job[] : [];
      const savedJobs = cachedJobs(found);
      const sourceRows = Array.isArray(result.sources) ? result.sources as SourceDiagnostic[] : [];
      const searchSummary = result.report && typeof result.report === "object" ? result.report as CrawlReport : null;
      setJobs(savedJobs);
      setSources(sourceRows);
      setSearchReport(searchSummary);
      const timings = result.timingsMs && typeof result.timingsMs === "object" ? result.timingsMs as SearchTimings : null;
      setSearchTimings(timings);
      setSourceActivityIssue(sourceRows.length === 0 && !searchSummary
        ? "The agent returned no crawl report or source activity. Check that the deployed Nvoid worker is running the current crawl API."
        : sourceRows.length === 0
          ? "The crawl completed without reporting configured job-search sources for this query."
          : "");
      setSearched(true);
      const totalFound = searchSummary?.totalFound ?? savedJobs.length;
      updateSearch(recordId, { resultCount: totalFound, jobs: savedJobs, sources: sourceRows, report: searchSummary || undefined, orchestration: undefined, timingsMs: timings || undefined, error: undefined });
      setNotice(savedJobs.length ? totalFound.toLocaleString() + " opportunities found across the crawl. " + savedJobs.length.toLocaleString() + " listings are ready to review." : "No matching opportunities returned. Try a broader job title or location.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Nvoid could not complete this search. Please try again.";
      setSearched(true);
      setSourceActivityIssue(message);
      setSearchTimings(null);
      setSearchReport(null);
      setVisibleJobCount(100);
      setNotice(message);
      updateSearch(recordId, { resultCount: 0, jobs: [], sources: [], report: undefined, orchestration: undefined, error: message });
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
          <p>Nvoid discovers public job pages by role and location, then crawls each accessible listing for verified details.</p>
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

      {busy && <div className="worker-search-progress" role="status" aria-live="polite"><LoaderCircle className="spin" size={16} /> Discovering and crawling public job pages for {jobTitle} in {location}…</div>}
      {notice && <div className={"search-notice" + (searched && !jobs.length ? " muted" : "")} role="status" aria-live="polite"><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={15} /></button></div>}

      {searched && (searchReport || sources.length > 0 || searchTimings || sourceActivityIssue) && (
        <section className="worker-crawl-diagnostics" aria-label="Agent crawl diagnostics">
          <div className="worker-crawl-diagnostics-heading">
            <div>
              <span>AGENT CRAWL REPORT</span>
              <h2>Discovery details</h2>
            </div>
            <span className="worker-crawl-depth">{searchReport?.depth === "deep" ? "Deep crawl" : "Standard crawl"}</span>
          </div>
          <div className="worker-crawl-stats">
            <div><strong>{(searchReport?.totalFound ?? jobs.length).toLocaleString()}</strong><span>Jobs collected</span></div>
            <div><strong>{(searchReport?.crawlPagesAttempted ?? 0).toLocaleString()}</strong><span>Job pages checked</span></div>
            <div><strong>{(searchReport?.searchPagesFetched ?? 0).toLocaleString()}</strong><span>Search pages read</span></div>
            <div><strong>{formatDuration(searchTimings?.total) || "—"}</strong><span>Total time</span></div>
          </div>
          {searchReport?.note && <p className="worker-crawl-report-note">{searchReport.note}</p>}
          {searchReport?.jobBoardSitesTargeted && searchReport.jobBoardSitesTargeted.length > 0 && (
            <div className="worker-crawl-country-boards">
              <span>Public job sites targeted:</span>
              {searchReport.jobBoardSitesTargeted.slice(0, 12).map((board) => <span key={board}>{board}</span>)}
              {searchReport.jobBoardSitesTargeted.length > 12 && <span>+{searchReport.jobBoardSitesTargeted.length - 12} more</span>}
            </div>
          )}
          {searchReport?.searchEnginesUsed && searchReport.searchEnginesUsed.length > 0 && (
            <div className="worker-crawl-country-boards">
              <span>Public search pages:</span>
              {searchReport.searchEnginesUsed.map((engine) => <span key={engine}>{engine}</span>)}
            </div>
          )}
          {searchTimings && (
            <div className="worker-crawl-timings">
              <span>Discovery <strong>{formatDuration(searchTimings.discovery ?? searchTimings.sourceSearch) || "—"}</strong></span>
              <span>Page crawling <strong>{formatDuration(searchTimings.crawl ?? searchTimings.detailEnrichment) || "—"}</strong></span>
              <span>AI ranking <strong>{formatDuration(searchTimings.aiReranking) || "Not enabled"}</strong></span>
              <span>Total <strong>{formatDuration(searchTimings.total) || "—"}</strong></span>
            </div>
          )}
          {sources.length > 0 && (
            <details className="worker-crawl-source-details">
              <summary>Inspect job-source execution ({sources.length})</summary>
              <div className="worker-crawl-source-list">
                {sources.map((source) => (
                  <article className="worker-crawl-source-row" key={source.serverId + ":" + (source.tool || "")}>
                    <div>
                      <strong>{sourceName(source.serverId)}</strong>
                      <span>{source.tool || "Internal public-web crawler"}</span>
                    </div>
                    <span className={"worker-crawl-source-status " + source.connectionStatus}>{source.connectionStatus.replace(/-/g, " ")}</span>
                    <div className="worker-crawl-source-counts">
                      <span>Fetched <strong>{(source.fetchedCount ?? 0).toLocaleString()}</strong></span>
                      <span>Matched <strong>{(source.locationMatchedCount ?? 0).toLocaleString()}</strong></span>
                      <span>Details <strong>{(source.detailsFetched ?? 0).toLocaleString()} / {(source.detailsRequested ?? 0).toLocaleString()}</strong></span>
                    </div>
                    {(source.error || source.skipReason) && <p>{clean(source.error || source.skipReason)}</p>}
                  </article>
                ))}
              </div>
            </details>
          )}
          {Boolean(searchReport?.pageReports?.length) && (
            <details className="worker-crawl-source-details">
              <summary>Inspect crawled pages ({(searchReport?.pageReports?.length ?? 0).toLocaleString()}{searchReport?.pageReportsTruncated ? " of " + (searchReport.pageReportsTotal ?? searchReport.pageReports?.length ?? 0).toLocaleString() + " saved" : ""})</summary>
              <div className="worker-crawl-source-list">
                {searchReport?.pageReports?.map((page, index) => (
                  <article className="worker-crawl-source-row" key={page.url + ":" + index}>
                    <div>
                      <strong>{page.pageTitle || page.url}</strong>
                      <span>{page.discoveredFrom || "Public web discovery"} · {page.extractionMethod || "No page extraction"}</span>
                      <a href={page.url} target="_blank" rel="noopener noreferrer">{page.url}</a>
                    </div>
                    <span className={"worker-crawl-source-status " + page.status}>{page.status.replace(/_/g, " ")}</span>
                    <div className="worker-crawl-source-counts">
                      <span>HTTP <strong>{page.httpStatus ?? "—"}</strong></span>
                      <span>Duration <strong>{formatDuration(page.durationMs) || "—"}</strong></span>
                    </div>
                    {Boolean(page.fieldsExtracted?.length) && <p>Extracted: {page.fieldsExtracted?.join(", ")}</p>}
                    {Boolean(page.missingFields?.length) && <p>Not published or unavailable: {page.missingFields?.join(", ")}</p>}
                    {page.reason && <p>{clean(page.reason)}</p>}
                  </article>
                ))}
              </div>
            </details>
          )}
          {sourceActivityIssue && <p className="worker-crawl-report-warning">{sourceActivityIssue}</p>}
        </section>
      )}

      {!searched && !busy && !searchId && (
        <section className="worker-search-guide" aria-label="How Nvoid search works">
          <div><span>01</span><strong>Search by role and location</strong><p>Describe the opportunity you want to find.</p></div>
          <div><span>02</span><strong>Review original listings</strong><p>Compare details extracted from public job pages.</p></div>
          <div><span>03</span><strong>Choose your next step</strong><p>Open the original listing and apply on the destination provided.</p></div>
        </section>
      )}

      {jobs.length > 0 && (
        <section className="public-results-section">
          <div className="section-heading">
            <div><span className="section-kicker">{searchId ? "SAVED SEARCH RESULTS" : "LIVE CRAWL RESULTS"}</span><h2>Opportunities for {jobTitle}</h2><p>{searchId ? `Restored from your saved search in ${location}.` : "Listings are extracted from public job pages reached by this crawl. Open the original page to confirm application status."}</p></div>
            <span className="result-count">{(searchReport?.totalFound ?? jobs.length).toLocaleString()} found</span>
          </div>
          <div className="worker-results-toolbar">
            <div className="worker-results-result-context"><strong>{(searchReport?.totalFound ?? jobs.length).toLocaleString()} opportunities</strong><span>Showing {displayedJobs.length.toLocaleString()} of {jobs.length.toLocaleString()} returned listings.</span></div>
            <label className="worker-results-sort"><span>Sort results</span><select value={sortMode} onChange={(event) => setSortMode(event.target.value as "relevance" | "newest" | "title")}><option value="relevance">Nvoid relevance</option><option value="newest">Newest first</option><option value="title">Job title</option></select></label>
          </div>
          <div className="public-job-grid">
            {displayedJobs.map((job, index) => {
              const company = job.company || "Company not listed";
              const locationText = job.location || job.country || "Location not provided";
              const listing = job.sourceUrl || job.jobUrl || job.applicationUrl;
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
                    {job.noticePeriod && <span>Notice: {job.noticePeriod}</span>}
                    {job.workMode && <span>{job.workMode}</span>}
                    {job.salary && <span>{job.salary}</span>}
                    {job.isOpen === false ? <span>Closed / expired</span> : job.isOpen === true ? <span>Open</span> : job.availabilityStatus && <span>Availability unverified</span>}}
                    {job.postedAt && <span><Clock3 size={11} />{postedDate(job.postedAt)}</span>}
                  </div>
                  <div className="public-job-footer">
                    {typeof job.matchScore === "number" ? <span className="match-label"><Target size={12} /> {Math.round(job.matchScore)}% profile fit</span> : <span className="external-label">External opportunity</span>}
                    {apply ? <button type="button" className="public-job-apply-button" onClick={() => openApplication(apply, job.source)}>Apply Now <ExternalLink size={14} /></button> : listing ? <span className="external-label">Original listing available</span> : <span className="external-label">Source link unavailable</span>}
                  </div>
                </article>
              );
            })}
          </div>
          {jobs.length > displayedJobs.length && (
            <div className="worker-crawl-pagination">
              <span>Showing {displayedJobs.length.toLocaleString()} of {jobs.length.toLocaleString()} returned opportunities</span>
              <button type="button" onClick={() => setVisibleJobCount((current) => Math.min(current + 100, jobs.length))}>
                Load more opportunities <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>
      )}

      {searched && jobs.length === 0 && (
        <section className="no-results">
          <div className="no-results-icon"><Search size={21} /></div>
          <h2>No matching jobs returned</h2>
          <p>Try another role or location. Nvoid only displays public opportunities it actually discovers and filters; it doesn't generate sample listings.</p>
        </section>
      )}


    </div>
  );
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Building2, CheckCircle2, Clock3, ExternalLink, LoaderCircle, MapPin, Search, Sparkles, Target, X } from "lucide-react";
import { useGuestHistory, type GuestSearchJob } from "./guest-shell";

type Job = GuestSearchJob;

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
  if (!response.ok) throw new Error(typeof payload.error === "string" ? payload.error : "The job search could not be completed.");
  return payload;
}

function cachedJobs(jobs: Job[]): Job[] {
  return jobs.filter((job): job is Job => Boolean(job && typeof job === "object")).slice(0, 100).map((job, index) => ({
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

export default function GuestHome({ searchId, initialJobTitle = "", initialLocation = "India" }: { searchId?: string; initialJobTitle?: string; initialLocation?: string }) {
  const router = useRouter();
  const { saveSearch, updateSearch, getSearch } = useGuestHistory();
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [location, setLocation] = useState(initialLocation || "India");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  useEffect(() => {
    if (!searchId) {
      setJobTitle(initialJobTitle);
      setLocation(initialLocation || "India");
      setJobs([]);
      setSearched(false);
      setActiveSearch("");
      setNotice("");
      return;
    }

    const saved = getSearch(searchId);
    if (!saved) {
      setJobTitle("");
      setLocation("India");
      setJobs([]);
      setSearched(false);
      setActiveSearch("");
      setNotice("This saved search is not available in this browser. Start a new search to continue.");
      return;
    }

    const savedJobs = Array.isArray(saved.jobs) ? saved.jobs : [];
    setJobTitle(saved.jobTitle);
    setLocation(saved.location);
    setJobs(savedJobs);
    setSearched(Array.isArray(saved.jobs));
    setActiveSearch(saved.id);
    setNotice(saved.error || (Array.isArray(saved.jobs)
      ? savedJobs.length
        ? `${saved.resultCount ?? savedJobs.length} saved opportunities restored for ${saved.jobTitle} in ${saved.location}.`
        : "This search is saved, but no matching job records were returned."
      : "Search details restored. Run it again to retrieve current job records."));
  }, [searchId, getSearch, initialJobTitle, initialLocation]);

  const runSearch = async (event?: FormEvent) => {
    event?.preventDefault();
    const role = jobTitle.trim();
    const place = location.trim();
    if (!role || !place) {
      setNotice("Enter a job title and location to search.");
      return;
    }

    setBusy(true);
    setNotice("");
    setJobs([]);
    setSearched(false);
    const recordId = activeSearch || saveSearch({ jobTitle: role, location: place, resultCount: 0 });
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
        countries: [place],
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
        body: JSON.stringify({ profile, limit: 100, syncToBackend: false })
      }));
      const found = Array.isArray(result.jobs) ? result.jobs as Job[] : [];
      const savedJobs = cachedJobs(found);
      setJobs(savedJobs);
      setSearched(true);
      updateSearch(recordId, { resultCount: savedJobs.length, jobs: savedJobs, error: undefined });
      setNotice(savedJobs.length ? savedJobs.length.toLocaleString() + " opportunities found across connected sources." : "No matching opportunities returned. Try a broader job title or location.");
      if (searchId !== recordId) router.push(`/search/${recordId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Worker could not complete this search. Please try again.";
      setSearched(true);
      setNotice(message);
      updateSearch(recordId, { resultCount: 0, jobs: [], error: message });
      if (searchId !== recordId) router.push(`/search/${recordId}`);
    } finally {
      setBusy(false);
    }
  };

  const chooseCategory = (value: string) => {
    setJobTitle(value);
    setActiveSearch("");
    document.getElementById("job-search")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-brand-lockup" aria-label="Worker">
          <span className="hero-brand-mark"><BrainCircuit size={58} strokeWidth={1.65} /></span>
          <span className="hero-brand-name">Worker</span>
        </div>
        <p className="hero-description">Discover relevant opportunities from connected job platforms and company career pages in one search.</p>

        <form id="job-search" className="public-search-panel" onSubmit={runSearch}>
          <div className="search-input-block">
            <label htmlFor="public-role">What role are you looking for?</label>
            <div className="search-input-line"><Search size={18} /><input id="public-role" value={jobTitle} onChange={(event) => { setJobTitle(event.target.value); setActiveSearch(""); }} placeholder="Job title, skill or company" autoComplete="off" /></div>
          </div>
          <div className="search-divider" />
          <div className="search-input-block location-block">
            <label htmlFor="public-location">Where?</label>
            <div className="search-input-line"><MapPin size={18} /><input id="public-location" value={location} onChange={(event) => { setLocation(event.target.value); setActiveSearch(""); }} placeholder="City, country or Remote" autoComplete="off" /></div>
          </div>
          <button className="search-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}{busy ? "Searching" : "Find jobs"}<ArrowRight size={16} /></button>
        </form>
        <div className="search-trust"><span><CheckCircle2 size={14} /> Browse without signing in</span><span><ShieldCheckIcon /> Your guest searches stay in this browser</span></div>

      </section>

      {notice && <div className={"search-notice" + (searched && !jobs.length ? " muted" : "")}><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={15} /></button></div>}

      {jobs.length > 0 && (
        <section className="public-results-section">
          <div className="section-heading">
            <div><span className="section-kicker">{searchId ? "SAVED SEARCH RESULTS" : "LIVE SEARCH RESULTS"}</span><h2>Opportunities for {jobTitle}</h2><p>{searchId ? `Restored from your saved search in ${location}.` : "Results are returned by the sources currently connected to Worker."}</p></div>
            <span className="result-count">{jobs.length.toLocaleString()} found</span>
          </div>
          <div className="public-job-grid">
            {jobs.map((job, index) => {
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
          <p>Try another role or location. Worker only displays opportunities returned by its connected sources; it doesn't generate sample listings.</p>
        </section>
      )}

      <section className="directory-section">
        <div className="section-heading">
          <div><span className="section-kicker">EXPLORE THE MARKET</span><h2>Browse by role</h2><p>Start with a role and let Worker search the connected job market.</p></div>
        </div>
        <div className="category-grid">
          {[
            ["Software development", "Java, Python, React, backend and frontend"],
            ["Data & analytics", "Data analyst, data engineer and BI roles"],
            ["Product & design", "Product managers, UX and UI designers"],
            ["Sales & marketing", "Growth, digital marketing and sales"],
            ["Finance & operations", "Finance, HR and business operations"],
            ["Internships & fresher", "Entry-level roles and internships"]
          ].map(([name, description]) => (
            <button className="category-card" key={name} onClick={() => chooseCategory(name)}>
              <span className="category-icon"><BriefcaseBusiness size={17} /></span>
              <strong>{name}</strong><small>{description}</small><ArrowUpRight size={15} className="category-arrow" />
            </button>
          ))}
        </div>
      </section>

      <section className="home-bottom-grid">
        <article className="home-feature-card">
          <div className="feature-icon"><Sparkles size={20} /></div>
          <span className="section-kicker">FOR CANDIDATES</span>
          <h2>Your job search, on autopilot.</h2>
          <p>Build a complete professional profile and let the Worker agent look for relevant opportunities across connected job platforms and company career pages.</p>
          <a href="/auth/register">Create your free profile <ArrowRight size={15} /></a>
        </article>
        <article className="home-feature-card recruiter-feature">
          <div className="feature-icon"><Building2 size={20} /></div>
          <span className="section-kicker">FOR EMPLOYERS</span>
          <h2>Post jobs. Find the right people.</h2>
          <p>Register your company, publish vacancies and review applicants with AI-assisted skills and experience matching.</p>
          <a href="/auth/register?role=3">Create an employer account <ArrowRight size={15} /></a>
        </article>
      </section>
    </div>
  );
}

function ShieldCheckIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></svg>;
}

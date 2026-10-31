"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, BrainCircuit, BriefcaseBusiness, Building2, CheckCircle2, Clock3, ExternalLink, LoaderCircle, MapPin, Search, Sparkles, Target, X } from "lucide-react";
import { useGuestHistory, type GuestSearchRecord } from "./guest-shell";

type Job = {
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
  raw?: Record<string, unknown>;
};

function clean(value?: string) {
  return (value || "").replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
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

export default function GuestHome() {
  const { saveSearch, updateSearch } = useGuestHistory();
  const [jobTitle, setJobTitle] = useState("");
  const [location, setLocation] = useState("India");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [searched, setSearched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  useEffect(() => {
    const onSelect = (event: Event) => {
      const item = (event as CustomEvent<GuestSearchRecord>).detail;
      if (!item) return;
      setJobTitle(item.jobTitle);
      setLocation(item.location);
      setNotice("Search restored. Press Find jobs to refresh current opportunities.");
      setActiveSearch(item.id);
      setJobs([]);
      setSearched(false);
      document.getElementById("job-search")?.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    window.addEventListener("nvoid:select-search", onSelect);
    return () => window.removeEventListener("nvoid:select-search", onSelect);
  }, []);

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
    const recordId = saveSearch({ jobTitle: role, location: place, resultCount: 0 });
    setActiveSearch(recordId);

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
        employmentTypes: ["full-time"],
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
      setJobs(found);
      setSearched(true);
      updateSearch(recordId, { resultCount: found.length });
      setNotice(found.length ? found.length.toLocaleString() + " opportunities found across connected sources." : "No matching opportunities returned. Try a broader job title or location.");
    } catch (error) {
      setSearched(true);
      setNotice(error instanceof Error ? error.message : "Nvoid could not complete this search. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const chooseCategory = (value: string) => {
    setJobTitle(value);
    document.getElementById("job-search")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="hero-brand-lockup" aria-label="nvoid.ai">
          <span className="hero-brand-mark"><BrainCircuit size={58} strokeWidth={1.65} /></span>
          <span className="hero-brand-name">nvoid.ai</span>
        </div>
        <p className="hero-description">Search jobs across connected sources, company career pages and public listings. Or let your personal Nvoid agent discover opportunities based on your profile.</p>

        <form id="job-search" className="public-search-panel" onSubmit={runSearch}>
          <div className="search-input-block">
            <label htmlFor="public-role">What role are you looking for?</label>
            <div className="search-input-line"><Search size={18} /><input id="public-role" value={jobTitle} onChange={(event) => setJobTitle(event.target.value)} placeholder="Job title, skill or company" autoComplete="off" /></div>
          </div>
          <div className="search-divider" />
          <div className="search-input-block location-block">
            <label htmlFor="public-location">Where?</label>
            <div className="search-input-line"><MapPin size={18} /><input id="public-location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="City, country or Remote" autoComplete="off" /></div>
          </div>
          <button className="search-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Search size={17} />}{busy ? "Searching" : "Find jobs"}<ArrowRight size={16} /></button>
        </form>
        <div className="search-trust"><span><CheckCircle2 size={14} /> Browse without signing in</span><span><ShieldCheckIcon /> Your guest searches stay in this browser</span></div>

        <div className="bot-promo">
          <div className="bot-promo-icon"><Sparkles size={21} /></div>
          <div className="bot-promo-copy">
            <strong>Let Nvoid Bot work for you</strong>
            <span>Create a professional profile once. Get personalized job discoveries and new-opportunity alerts.</span>
          </div>
          <a href="/auth/register" className="bot-promo-link">Create free profile <ArrowUpRight size={15} /></a>
        </div>
      </section>

      {notice && <div className={"search-notice" + (searched && !jobs.length ? " muted" : "")}><span>{notice}</span><button onClick={() => setNotice("")} aria-label="Dismiss notice"><X size={15} /></button></div>}

      {jobs.length > 0 && (
        <section className="public-results-section">
          <div className="section-heading">
            <div><span className="section-kicker">LIVE SEARCH RESULTS</span><h2>Opportunities for {jobTitle}</h2><p>Results are returned by the sources currently connected to Nvoid.</p></div>
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
          <p>Try another role or location. Nvoid only displays opportunities returned by its connected sources; it doesn't generate sample listings.</p>
        </section>
      )}

      <section className="directory-section">
        <div className="section-heading">
          <div><span className="section-kicker">EXPLORE THE MARKET</span><h2>Browse by role</h2><p>Start with a role and let Nvoid search the connected job market.</p></div>
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
          <p>Build a complete professional profile and let Nvoid Bot look for relevant opportunities across connected job platforms and company career pages.</p>
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

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Globe2,
  GraduationCap,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  XCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Worker AI Model — Alpha - k1 | Smarter Job Discovery",
  description: "Meet Worker Alpha - k1. Learn how Worker helps job seekers discover opportunities, understand role relevance, compare matches and stay in control."
};

const reasons = [
  {
    icon: Globe2,
    title: "Jobs are spread everywhere",
    text: "Useful openings appear across different job boards, public listings and company career pages. One search destination can help reduce the need to repeat the same search site by site."
  },
  {
    icon: Target,
    title: "The right role is more than a keyword",
    text: "Two employers can describe similar work with different titles. Worker considers role wording, skills and the details available in each listing to help surface more relevant opportunities."
  },
  {
    icon: Clock3,
    title: "Your time should go to good opportunities",
    text: "Filtering unrelated roles and reducing duplicate listings helps you spend more time reviewing suitable jobs and less time sorting through repeated results."
  },
  {
    icon: ShieldCheck,
    title: "You should see where a job came from",
    text: "Worker keeps the original source context and links where a provider supplies them, so you can inspect the employer's listing before deciding what to do."
  }
];

const audiences = [
  {
    icon: GraduationCap,
    title: "Freshers and recent graduates",
    text: "Explore entry-level roles and related job-title wording without relying on one search phrase."
  },
  {
    icon: BriefcaseBusiness,
    title: "Experienced professionals",
    text: "Focus searches around your role, skills, experience and preferred location."
  },
  {
    icon: UserRound,
    title: "Career changers",
    text: "Discover adjacent role titles and opportunities that may use different wording for similar skills."
  },
  {
    icon: Globe2,
    title: "Remote and global job seekers",
    text: "Explore remote opportunities while paying attention to country and location eligibility—not just the word “remote”."
  }
];

const capabilities = [
  "Understand a job search using role, skills, keywords and location preferences.",
  "Search across the job sources that are available to Worker at the time of your search.",
  "Recognise closely related job-title wording where it is appropriate.",
  "Compare available listing details with your target role and profile signals.",
  "Rank opportunities by relevance and show reasons that contributed to a match.",
  "Reduce repeated listings and preserve original job links when sources provide them.",
  "Take longer on broad searches when more sources, regions or public pages need to be checked."
];

const boundaries = [
  "Guarantee that every job published anywhere on the internet has been found.",
  "Promise a perfect 100% finding rate or a 100% chance of getting hired.",
  "Know requirements that an employer has not published or a source has not supplied.",
  "Guarantee that a listing is still open without checking the employer's current application page.",
  "Treat every remote job as available to applicants in every country.",
  "Replace your judgement, an employer's selection process or your review of the original job description."
];

const stages = [
  {
    number: "01",
    icon: UserRound,
    title: "Understand your goal",
    text: "You provide the role you want, preferred location, skills and other useful preferences."
  },
  {
    number: "02",
    icon: Search,
    title: "Look across available sources",
    text: "Worker searches the connected job sources that can handle your request. Sources respond at different speeds and may have different coverage."
  },
  {
    number: "03",
    icon: ShieldCheck,
    title: "Clean up the results",
    text: "Listings are converted into a consistent format, checked for role and location relevance, and compared to reduce duplicates."
  },
  {
    number: "04",
    icon: Target,
    title: "Rank relevant opportunities",
    text: "Worker uses the job details it received to rank results and explain useful match signals. You open the source and make the final decision."
  }
];

export default function ModelsPage() {
  return (
    <main className="catalog-page model-product-page">
      <section className="model-product-hero">
        <div className="model-product-hero-copy">
          <span className="model-product-eyebrow"><Sparkles size={14} /> WORKER INTELLIGENCE</span>
          <h1>Your next opportunity should be easier to find.</h1>
          <p>Worker helps you search beyond a single job board, understand which opportunities are closer to your goals, and spend more time on roles worth reviewing.</p>
          <div className="model-product-release">
            <span><CalendarDays size={15} /> Released 2 October 2026</span>
            <span><CheckCircle2 size={15} /> Current model experience</span>
          </div>
          <Link href="/" className="model-product-primary-link">Explore jobs <ArrowUpRight size={16} /></Link>
        </div>
        <aside className="model-current-card" aria-label="Current Worker model">
          <div className="model-current-card-top">
            <span className="model-current-icon"><BrainCircuit size={25} /></span>
            <span className="model-current-live"><span /> CURRENT</span>
          </div>
          <span className="model-current-label">WORKER'S CURRENT MODEL</span>
          <h2>Alpha <span>- k1</span></h2>
          <p>Your AI-powered job discovery and matching experience—designed to help make job searching more focused, understandable and useful.</p>
          <div className="model-current-divider" />
          <div className="model-current-foot">
            <span>Release date</span>
            <strong>02 OCT 2026</strong>
          </div>
        </aside>
      </section>

      <section className="model-product-value-grid" aria-label="What Worker helps with">
        <article><span><Globe2 size={18} /></span><strong>Wider discovery</strong><p>Search across available job sources in one place.</p></article>
        <article><span><Target size={18} /></span><strong>More relevant results</strong><p>Focus on role, skills and location signals.</p></article>
        <article><span><ShieldCheck size={18} /></span><strong>Clearer decisions</strong><p>Review match reasons and original job sources.</p></article>
      </section>

      <section className="model-product-section">
        <div className="model-product-section-heading">
          <span className="model-product-eyebrow">WHY IT MATTERS</span>
          <h2>Why every job seeker can benefit from a smarter search.</h2>
          <p>Finding a job is not just about typing a title into a search box. Relevant opportunities can be scattered, described differently and restricted to specific locations. Worker brings discovery and relevance checks into one guided experience.</p>
        </div>
        <div className="model-product-reasons">
          {reasons.map((item) => {
            const Icon = item.icon;
            return <article key={item.title}><span className="model-product-card-icon"><Icon size={20} /></span><h3>{item.title}</h3><p>{item.text}</p></article>;
          })}
        </div>
      </section>

      <section className="model-product-audience">
        <div className="model-product-section-heading">
          <span className="model-product-eyebrow">MADE FOR DIFFERENT CAREER STAGES</span>
          <h2>Wherever you are in your career.</h2>
          <p>Worker is designed to make opportunity discovery more useful for different kinds of job searches.</p>
        </div>
        <div className="model-product-audience-grid">
          {audiences.map((item) => {
            const Icon = item.icon;
            return <article key={item.title}><span><Icon size={18} /></span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>;
          })}
        </div>
      </section>

      <section className="model-product-how">
        <div className="model-product-section-heading">
          <span className="model-product-eyebrow">HOW ALPHA - K1 WORKS WITH WORKER</span>
          <h2>From your search to a shortlist worth reviewing.</h2>
          <p>The model assists the process; real job information comes from the sources Worker can access.</p>
        </div>
        <div className="model-product-stage-list">
          {stages.map((item) => {
            const Icon = item.icon;
            return <article key={item.number}><span className="model-product-stage-number">{item.number}</span><span className="model-product-stage-icon"><Icon size={19} /></span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>;
          })}
        </div>
      </section>

      <section className="model-product-capability-grid">
        <article className="model-product-can">
          <div className="model-product-list-heading"><span><CheckCircle2 size={18} /></span><div><span className="model-product-eyebrow">WHAT IT CAN DO</span><h2>Useful assistance, grounded in job information.</h2></div></div>
          <ul>{capabilities.map((item) => <li key={item}><CheckCircle2 size={15} />{item}</li>)}</ul>
        </article>
        <article className="model-product-cannot">
          <div className="model-product-list-heading"><span><XCircle size={18} /></span><div><span className="model-product-eyebrow">WHAT IT CANNOT PROMISE</span><h2>Clear limits matter as much as capabilities.</h2></div></div>
          <ul>{boundaries.map((item) => <li key={item}><XCircle size={15} />{item}</li>)}</ul>
        </article>
      </section>

      <section className="model-product-match">
        <div className="model-product-section-heading">
          <span className="model-product-eyebrow">UNDERSTANDING YOUR MATCH</span>
          <h2>A match score helps you prioritise. It does not decide your future.</h2>
          <p>Worker may show a score from 0 to 100 to help sort opportunities by how closely the available listing information aligns with your search and profile. A higher score means stronger alignment in the information Worker could evaluate—not a guaranteed interview or offer.</p>
        </div>
        <div className="model-product-match-points">
          <article><strong>Role relevance</strong><p>Does the job title and description resemble the kind of work you are seeking?</p></article>
          <article><strong>Skills overlap</strong><p>Do the listed skills and requirements overlap with the skills you provided?</p></article>
          <article><strong>Location and work mode</strong><p>Does the listing provide location or remote-work information that fits your preference?</p></article>
          <article><strong>Available compensation details</strong><p>Where salary information is published, does it overlap with your stated range?</p></article>
        </div>
        <p className="model-product-match-note">Missing information is not proof of a mismatch, and a high score is not proof that you meet every employer requirement. Read the job description before applying.</p>
      </section>

      <section className="model-product-latency">
        <div className="model-product-latency-heading">
          <span className="model-product-card-icon"><Clock3 size={20} /></span>
          <div><span className="model-product-eyebrow">SEARCH SPEED AND COVERAGE</span><h2>Why a worldwide search can take longer.</h2></div>
        </div>
        <div className="model-product-latency-grid">
          <article><strong>Focused location search</strong><p>A city or country search has a narrower scope. Worker can focus on listings that appear relevant to that place.</p></article>
          <article><strong>Worldwide discovery</strong><p>A global search can involve more regions, sources and location-eligibility clues. More coverage can mean more work before results are ready.</p></article>
          <article><strong>Different source speeds</strong><p>Worker can search sources in parallel, but one slow or unavailable source can affect the overall completion time. No fixed response time is promised.</p></article>
        </div>
      </section>

      <section className="model-product-trust">
        <span className="model-product-trust-icon"><ShieldCheck size={23} /></span>
        <div>
          <span className="model-product-eyebrow">HONEST FINDINGS. CLEAR EXPECTATIONS.</span>
          <h2>We aim for the most relevant findings—not a made-up 100% claim.</h2>
          <p>No search engine can truthfully promise that it finds every job on the internet or that every external listing is perfectly current and complete. There is no independently verified benchmark here that supports a 100% finding or accuracy rate, so Worker does not present one as fact.</p>
          <p>A meaningful quality measure needs to distinguish how many sources responded, how many listings were found, how many passed relevance checks, how many were duplicates, and how many were independently confirmed as still open. These are different measurements; they should never be compressed into one misleading “100% accurate” badge.</p>
          <div className="model-product-trust-points">
            <span><CheckCircle2 size={15} /> Original source links where available</span>
            <span><CheckCircle2 size={15} /> Relevance reasons to help you review</span>
            <span><CheckCircle2 size={15} /> Clear distinction between discovery and confirmation</span>
          </div>
        </div>
      </section>

      <section className="model-product-final">
        <div><span className="model-product-eyebrow">YOUR NEXT STEP</span><h2>Let your next search be more focused.</h2><p>Tell Worker what kind of opportunity you want to find. Review the results, check the original listing and choose what is right for you.</p></div>
        <Link href="/">Start searching <ArrowRight size={16} /></Link>
      </section>
    </main>
  );
}

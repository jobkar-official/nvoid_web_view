import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BrainCircuit, CalendarDays } from "lucide-react";
import { notFound } from "next/navigation";

const modelCatalog = {
  "alpha-k1": {
    slug: "alpha-k1",
    name: "Alpha - k1",
    releaseDate: "2 October 2026",
    status: "Current discovery model",
    description: "Alpha - k1 is Worker’s current AI-assisted job discovery and matching model. It helps candidates search across available job sources, understand role relevance and organise opportunities for review."
  }
} as const;

type ModelSlug = keyof typeof modelCatalog;
type ModelDefinition = (typeof modelCatalog)[ModelSlug];
type ModelPageProps = { params: Promise<{ model: string }> };

export function generateStaticParams() {
  return Object.keys(modelCatalog).map((model) => ({ model }));
}

export async function generateMetadata({ params }: ModelPageProps): Promise<Metadata> {
  const { model } = await params;
  const modelInfo = modelCatalog[model as ModelSlug];
  if (!modelInfo) notFound();

  return {
    title: `Worker ${modelInfo.name} — AI Job Discovery Model`,
    description: `${modelInfo.description} Explore model capabilities, matching, search coverage and Worker’s free employer hiring workspace.`
  };
}

const getOverviewRows = (modelInfo: ModelDefinition) => [
  {
    title: "Current model",
    detail: `${modelInfo.name} is the model currently powering Worker’s job discovery and matching experience.`
  },
  {
    title: "Release date",
    detail: `${modelInfo.releaseDate}.`
  },
  {
    title: "Who it is for",
    detail: "Freshers, recent graduates, experienced professionals, career changers and people exploring remote or international opportunities."
  },
  {
    title: "The outcome",
    detail: "A more focused set of job opportunities, with relevance signals and source information that help you decide what deserves your attention."
  }
];

const choiceRows = [
  {
    title: "Searching one website at a time",
    detail: "Worker can search the job sources available to it in one guided search, reducing the need to repeat the same search across multiple places."
  },
  {
    title: "Relying only on exact job titles",
    detail: "Worker can consider related role wording, skills and details in a listing, so a relevant opportunity is not judged by its title alone."
  },
  {
    title: "Sorting through repeated listings",
    detail: "Worker brings listing details into a more consistent format and checks for likely duplicates, helping make a result list easier to review."
  },
  {
    title: "Guessing why a role appeared",
    detail: "Where enough job information is available, Worker can show the relevance signals that contributed to a match."
  },
  {
    title: "Losing the original job source",
    detail: "Original listing links and source context are kept where a provider supplies them, so you can inspect the employer’s information before applying."
  }
];

const hiringRows = [
  {
    title: "Company workspace",
    detail: "Create your employer presence, maintain company information and keep your hiring activity connected to your organisation.",
    outcome: "Candidates can understand the company behind an opening, while your team keeps its hiring identity in one place."
  },
  {
    title: "Publish job openings",
    detail: "Create vacancies with the role, responsibilities, skills, location, experience and work details candidates need to review.",
    outcome: "Present opportunities to people exploring roles across the Worker network without a Worker job-posting fee."
  },
  {
    title: "Manage applications",
    detail: "Review applications received for your company's published openings and keep candidate details connected to the relevant job.",
    outcome: "Spend less time switching between scattered applicant records and more time reviewing people."
  },
  {
    title: "Shortlists and hiring stages",
    detail: "Organise candidate review, build shortlists and track applicants as they move through your hiring stages.",
    outcome: "See who is ready for review, who is shortlisted and what needs attention next."
  },
  {
    title: "Messages and notifications",
    detail: "Keep up with candidate conversations and important hiring or account updates from your employer workspace.",
    outcome: "Keep communication and follow-up connected to your hiring activity."
  },
  {
    title: "AI-assisted candidate relevance",
    detail: "Use available skills, experience and role-fit information to help prioritise which applications deserve a closer review.",
    outcome: "Get useful decision support while your hiring team keeps control of interviews, selection and offers."
  }
];

const workflowRows = [
  {
    title: "1. Describe your goal",
    detail: "Choose the role you want, add skills, set a location and include preferences such as experience or work mode.",
    outcome: "A search shaped around the opportunity you are actually looking for."
  },
  {
    title: "2. Discover available jobs",
    detail: "Worker checks the job sources that are available for your search. Source coverage and response speed can vary.",
    outcome: "Opportunities gathered from the sources that could be reached for that search."
  },
  {
    title: "3. Organise the information",
    detail: "Listing details are brought into a consistent structure, checked against your search and compared for likely duplicates.",
    outcome: "A cleaner set of results that is easier to compare."
  },
  {
    title: "4. Review your matches",
    detail: "Worker ranks opportunities using the information it received and can show the signals that contributed to relevance.",
    outcome: "A prioritised list for you to inspect, verify and decide whether to apply."
  }
];

const capabilityRows = [
  {
    title: "Search by role and skills",
    detail: "Use a target role, keywords, skills and location preferences together.",
    outcome: "Results can reflect more than one exact phrase."
  },
  {
    title: "Explore related job titles",
    detail: "Recognise role descriptions that may use different wording for similar work.",
    outcome: "A wider view of roles that may fit your direction."
  },
  {
    title: "Compare opportunities",
    detail: "Use the available job description, skills, location, work mode and compensation details.",
    outcome: "More context when deciding which roles deserve a closer look."
  },
  {
    title: "Prioritise relevant listings",
    detail: "Rank results using the job details and profile or preference signals available.",
    outcome: "A shortlist ordered by relevance, not a promise of being selected."
  },
  {
    title: "Reduce repeated results",
    detail: "Compare listing details to identify likely duplicates.",
    outcome: "Less time spent reviewing the same opportunity more than once."
  },
  {
    title: "Return to the original listing",
    detail: "Keep source context and original links when supplied by the source.",
    outcome: "You can check the employer’s own description before taking action."
  }
];

const limitRows = [
  {
    title: "It cannot find every job online",
    detail: "Worker can only return opportunities from sources it can access. Some employers and job boards may not be covered."
  },
  {
    title: "It cannot guarantee a perfect finding rate",
    detail: "A 100% discovery or accuracy claim would need independent evidence. Worker does not present an unverified figure as fact."
  },
  {
    title: "It cannot promise an interview or offer",
    detail: "A relevance score describes the information match. Hiring decisions depend on the employer, applicants and factors Worker cannot know."
  },
  {
    title: "It cannot verify every listing automatically",
    detail: "A source may contain an expired, changed or incomplete listing. Check the employer’s application page before applying."
  },
  {
    title: "It cannot assume every remote role is worldwide",
    detail: "Remote opportunities can still have country, time-zone, work-authorisation or residency restrictions."
  },
  {
    title: "It cannot replace your judgement",
    detail: "Read the job description, check the employer and decide whether the opportunity is right for you."
  }
];

const matchRows = [
  {
    title: "Role relevance",
    detail: "How closely the title and description align with the type of work you want."
  },
  {
    title: "Skills overlap",
    detail: "How much the listed skills and requirements overlap with the skills you have shared."
  },
  {
    title: "Location and work mode",
    detail: "Whether the available location and remote, hybrid or on-site details fit your preferences."
  },
  {
    title: "Compensation details",
    detail: "Where salary information is published, whether it overlaps with the range you provided."
  }
];

const coverageRows = [
  {
    title: "City or country search",
    detail: "A narrower search can focus on opportunities associated with a specific place."
  },
  {
    title: "Remote or worldwide search",
    detail: "A broader search can involve more regions, sources and eligibility details, so it may take longer."
  },
  {
    title: "Source response time",
    detail: "Sources can respond at different speeds. A slow or unavailable source can affect when the overall search is complete."
  }
];

const qualityRows = [
  {
    title: "Source coverage",
    detail: "How many sources were available and how many responded to a search."
  },
  {
    title: "Useful discoveries",
    detail: "How many returned listings passed relevance checks for the role and location."
  },
  {
    title: "Duplicate reduction",
    detail: "How many repeated listings were identified and grouped or removed."
  },
  {
    title: "Listing freshness",
    detail: "How many opportunities were independently checked and confirmed as still open."
  }
];

function DetailRows({ rows, showOutcome = false }: {
  rows: { title: string; detail: string; outcome?: string }[];
  showOutcome?: boolean;
}) {
  return (
    <div className="model-docs-rows">
      {rows.map((row) => (
        <article className="model-docs-row" key={row.title}>
          <h3>{row.title}</h3>
          <div className="model-docs-row-copy">
            <p>{row.detail}</p>
            {showOutcome && row.outcome ? (
              <div className="model-docs-outcome"><span>What this means for you</span><p>{row.outcome}</p></div>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export default async function ModelDetailsPage({ params }: ModelPageProps) {
  const { model } = await params;
  const modelInfo = modelCatalog[model as ModelSlug];
  if (!modelInfo) notFound();

  return (
    <main className="catalog-page model-docs-page">
      <div className="model-docs-layout">
        <aside className="model-docs-sidebar">
          <div className="model-docs-sidebar-heading">
            <span>WORKER PLATFORM GUIDE</span>
            <strong>Worker guide</strong>
          </div>
          <nav aria-label="Model guide sections" className="model-docs-nav">
            <a href="#overview"><span>01</span>Overview</a>
            <a href="#why-worker"><span>02</span>Why choose Worker</a>
            <a href="#hiring"><span>03</span>Free hiring for employers</a>
            <a href="#how-it-works"><span>04</span>Job discovery workflow</a>
            <a href="#capabilities"><span>05</span>Model capabilities</a>
            <a href="#limitations"><span>06</span>Model limitations</a>
            <a href="#matching"><span>07</span>Understanding matches</a>
            <a href="#coverage"><span>08</span>Search coverage and speed</a>
            <a href="#quality"><span>09</span>Finding quality</a>
          </nav>
          <div className="model-docs-sidebar-model">
            <span>THE CURRENT MODEL</span>
            <strong>{modelInfo.name}</strong>
            <p>Released {modelInfo.releaseDate}</p>
          </div>
        </aside>

        <div className="model-docs-reading">
          <div className="model-docs-breadcrumb">
            <span>Worker</span><ChevronRight size={14} /><Link href="/models">Models</Link><ChevronRight size={14} /><strong>{modelInfo.name}</strong>
          </div>

          <header className="model-docs-header">
            <span className="model-docs-eyebrow"><BrainCircuit size={15} /> WORKER / EMPLOYMENT PLATFORM</span>
            <h1>Discover opportunities. Hire talent. Manage hiring.</h1>
            <p>Worker brings AI-assisted job discovery and a free hiring workspace together. Job seekers can explore opportunities with {modelInfo.name}. Employers can build a company presence, publish jobs, review applications, organise shortlists and manage hiring activity with zero Worker platform fees for core hiring and job management.</p>
            <div className="model-docs-meta">
              <span><BrainCircuit size={15} /> Current discovery model: {modelInfo.name}</span>
              <span><CalendarDays size={15} /> Released {modelInfo.releaseDate}</span>
              <span><ShieldCheck size={15} /> Free employer platform</span>
            </div>
            <div className="model-docs-header-actions">
              <Link href="/" className="model-docs-action-link">Explore jobs <ArrowUpRight size={15} /></Link>
              <Link href="/free-job-posting" className="model-docs-action-link">For employers <ArrowUpRight size={15} /></Link>
            </div>
          </header>

          <section className="model-docs-section" id="overview">
            <div className="model-docs-section-heading">
              <span>01</span>
              <div><p>OVERVIEW</p><h2>One employment platform for candidates and employers.</h2></div>
            </div>
            <p className="model-docs-intro">Worker serves both sides of the employment journey. Candidates discover opportunities and understand role relevance. Employers publish openings and manage candidate review. {modelInfo.name} is the current model behind the job discovery and matching experience.</p>
            <DetailRows rows={getOverviewRows(modelInfo)} />
          </section>

          <section className="model-docs-section" id="why-worker">
            <div className="model-docs-section-heading">
              <span>02</span>
              <div><p>WHY CHOOSE WORKER</p><h2>Spend less time searching. More time choosing.</h2></div>
            </div>
            <p className="model-docs-intro">A job search can become a long cycle of repeating keywords, switching websites and sorting through similar listings. Worker brings discovery, relevance checks and source review into one workflow.</p>
            <div className="model-docs-comparison-labels"><span>Common job search friction</span><span>Worker’s approach</span></div>
            <DetailRows rows={choiceRows} />
            <p className="model-docs-footnote">The sources and features available can vary by search. This describes Worker’s intended workflow, not a claim that every other job platform works in the same way.</p>
          </section>

          <section className="model-docs-section" id="hiring">
            <div className="model-docs-section-heading">
              <span>03</span>
              <div><p>FREE HIRING FOR EMPLOYERS</p><h2>Hire and manage your hiring workflow at zero Worker platform cost.</h2></div>
            </div>
            <p className="model-docs-intro">Worker is built to make core hiring accessible without charging employers a Worker platform fee for job posting and hiring management. Bring your company presence, vacancies, applicants and candidate conversations into one employer workspace.</p>
            <DetailRows rows={hiringRows} showOutcome />
            <p className="model-docs-footnote">AI-assisted matching supports candidate review. Employers remain responsible for evaluating applicants and making every hiring decision.</p>
            <div className="model-docs-section-actions">
              <Link href="/free-job-posting" className="model-docs-action-link">Explore free job posting <ArrowUpRight size={15} /></Link>
              <Link href="/auth/register?role=3" className="model-docs-action-link">Create employer account <ArrowUpRight size={15} /></Link>
            </div>
          </section>

          <section className="model-docs-section" id="how-it-works">
            <div className="model-docs-section-heading">
              <span>04</span>
              <div><p>JOB DISCOVERY WORKFLOW</p><h2>From your search to a shortlist worth reviewing.</h2></div>
            </div>
            <p className="model-docs-intro">You stay in control at every step. Worker organises the search and helps prioritise the information it can access.</p>
            <DetailRows rows={workflowRows} showOutcome />
          </section>

          <section className="model-docs-section" id="capabilities">
            <div className="model-docs-section-heading">
              <span>05</span>
              <div><p>MODEL CAPABILITIES</p><h2>What {modelInfo.name} can help you do.</h2></div>
            </div>
            <DetailRows rows={capabilityRows} showOutcome />
          </section>

          <section className="model-docs-section" id="limitations">
            <div className="model-docs-section-heading">
              <span>06</span>
              <div><p>MODEL LIMITATIONS</p><h2>What it cannot promise.</h2></div>
            </div>
            <p className="model-docs-intro">Clear limits help you use search results responsibly. Worker is an assistant for discovery and comparison, not a guarantee about the job market or hiring decisions.</p>
            <DetailRows rows={limitRows} />
          </section>

          <section className="model-docs-section" id="matching">
            <div className="model-docs-section-heading">
              <span>07</span>
              <div><p>UNDERSTANDING MATCHES</p><h2>A match score helps you prioritise. It does not predict hiring.</h2></div>
            </div>
            <p className="model-docs-intro">When Worker displays a score from 0 to 100, it represents how closely the available listing information aligns with your search and profile signals. It is not a probability of getting an interview or offer.</p>
            <DetailRows rows={matchRows} />
            <div className="model-docs-note"><strong>How to read the score</strong><p>A higher score indicates stronger alignment in the information Worker could evaluate. Missing information is not proof of a mismatch, and a high score does not prove that you meet every employer requirement. Read the full job description before applying.</p></div>
          </section>

          <section className="model-docs-section" id="coverage">
            <div className="model-docs-section-heading">
              <span>08</span>
              <div><p>SEARCH COVERAGE AND SPEED</p><h2>Why a worldwide search can take longer.</h2></div>
            </div>
            <DetailRows rows={coverageRows} />
          </section>

          <section className="model-docs-section" id="quality">
            <div className="model-docs-section-heading">
              <span>09</span>
              <div><p>FINDING QUALITY</p><h2>Useful findings matter more than an unsupported 100% claim.</h2></div>
            </div>
            <p className="model-docs-intro">No search service can truthfully promise that it finds every job on the internet or that every external listing is perfectly current. There is no independently verified benchmark for Worker that supports a 100% finding or accuracy rate, so we do not present one as fact.</p>
            <DetailRows rows={qualityRows} />
            <p className="model-docs-footnote">These measurements answer different questions. A source responding does not mean every job was found, and a relevant result does not mean the vacancy is still open.</p>
          </section>

          <footer className="model-docs-footer">
            <div>
              <span>ONE PLATFORM. TWO SIDES OF OPPORTUNITY.</span>
              <h2>Find your next opportunity or start building your team.</h2>
              <p>Search for roles as a candidate, or publish vacancies and manage applicants as an employer. Worker brings both journeys together.</p>
            </div>
            <div className="model-docs-footer-actions">
              <Link href="/" className="model-docs-cta">Explore jobs <ArrowUpRight size={16} /></Link>
              <Link href="/free-job-posting" className="model-docs-cta">Hire with Worker <ArrowUpRight size={16} /></Link>
            </div>
          </footer>
        </div>
      </div>
    </main>
  );
}

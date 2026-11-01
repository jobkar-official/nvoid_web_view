import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BrainCircuit,
  Building2,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  FileSearch,
  Globe2,
  Layers3,
  LockKeyhole,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Workflow,
  XCircle
} from "lucide-react";

export const metadata: Metadata = {
  title: "Worker Models and AI Engines",
  description: "Understand how Worker searches connected job sources, checks location and role relevance, ranks matches, and performs evidence-based public research."
};

const engines = [
  {
    id: "01",
    icon: Search,
    name: "Job Discovery Engine",
    category: "Source search · normalization · deduplication",
    status: "Active pipeline",
    statusTone: "live",
    summary: "Finds real vacancies from the job boards, public feeds, company career systems and MCP search tools that are enabled and connected in the Worker deployment. It gathers the records first; it does not invent job listings.",
    latency: "Variable · source-dependent",
    latencyDetail: "Worker starts connected source searches in parallel. The final response is still affected by the slowest responding source, provider rate limits, network delays and any additional detail lookups. When a broad worldwide search or public-page crawler is enabled, more pages and locations may need to be checked.",
    steps: [
      "Read the requested role, location, country, skills and work preferences.",
      "Build source-specific search arguments. When configured, AI may suggest up to five closely related role titles for the public search-engine layer; the original role is still searched.",
      "Call every compatible connected job-search tool independently and in parallel. One provider error is recorded without automatically cancelling the other providers.",
      "Normalize different provider responses into a consistent job record and keep source attribution and the original listing URL whenever the provider supplies them.",
      "Apply role and location relevance checks, remove duplicates by application URL, job URL or a title/company/location fallback, then enrich selected leading results where a source offers a detail tool."
    ],
    inputs: [
      "Target job title and comparable role wording",
      "City, region, country or Worldwide scope",
      "Skills, keywords, seniority and remote preferences",
      "Enabled source connectors and their current availability"
    ],
    outputs: [
      "Normalized job records with company, title, location and available details",
      "Original job/source links and provider attribution",
      "Per-source counts, connection state, errors and crawl/search reports where supplied"
    ],
    strengths: [
      "Queries connected providers concurrently instead of depending on one job board.",
      "Keeps provider-level outcomes visible, so an unavailable source is not silently presented as searched successfully.",
      "Normalizes different response formats and removes many cross-source duplicates.",
      "Preserves source context so a person can open the original listing and verify it."
    ],
    limits: [
      "Coverage is limited to sources that are configured, connected, authorized and returning results. It does not search every website on the internet.",
      "Providers may return stale, incomplete or inconsistently structured listings. Missing salary, seniority or location fields cannot be verified by the model.",
      "Deduplication is strongest when providers share a URL or stable identity; two different URLs for the same vacancy can still appear separately.",
      "An unavailable provider, rate limit, blocked page or expired listing can reduce coverage."
    ]
  },
  {
    id: "02",
    icon: Target,
    name: "Profile Matching Engine",
    category: "Role fit · eligibility checks · ranking",
    status: "Active pipeline",
    statusTone: "live",
    summary: "Checks whether a discovered role is relevant to the requested occupation and location, then ranks remaining jobs against the supplied candidate profile. The score is a relevance indicator—not a hiring probability or a guarantee that an employer will shortlist someone.",
    latency: "Low to variable",
    latencyDetail: "The deterministic filters and initial score are calculated locally after source results arrive. When the server-side AI model is enabled, the leading candidates can receive an additional remote scoring pass. That improves contextual ranking but adds model-provider latency.",
    steps: [
      "Normalize the role title, role-family signals, job description, location, skills and other available fields.",
      "Reject clear mismatches such as an unrelated role family, an unwanted leadership level, or an internship when the requested role is not an internship.",
      "Check location evidence using job location fields, country/city aliases, region signals, remote flags and explicit worldwide-eligibility wording where present.",
      "Calculate a deterministic starting score from role title, requested skills/keywords, location or remote preference, and published salary overlap.",
      "If AI is configured, score up to the leading 100 candidates in batches of ten, with up to three batches processed concurrently. Blend the AI score with the deterministic score; if AI fails, retain the deterministic result."
    ],
    inputs: [
      "Candidate's target title, experience, skills and keywords",
      "Preferred city, country, remote preference and eligible regions",
      "Salary range and currency when provided",
      "The normalized job title, description, location and salary fields returned by sources"
    ],
    outputs: [
      "A 0–100 relevance score used for ranking",
      "Short match reasons based on the available profile and listing evidence",
      "A ranked list of jobs that passed the initial role and location checks"
    ],
    strengths: [
      "Uses deterministic checks before optional AI reranking; a failed AI request does not erase the deterministic result.",
      "Explains important match signals such as skills, title, location and salary overlap.",
      "Can identify obvious role-family and seniority mismatches before ranking.",
      "AI reranking evaluates only the supplied profile and job evidence, rather than being asked to invent missing qualifications."
    ],
    limits: [
      "A score of 90 is not a 90% chance of getting an interview. It is not a statistically calibrated probability.",
      "The initial score uses available text and structured fields. Synonyms, vague job descriptions and missing data can affect the ranking.",
      "A remote label does not always mean worldwide eligibility. Published country restrictions and location evidence matter, but provider metadata can still be incomplete.",
      "The AI layer is an additional judgement, not a factual verification service. It can misread ambiguous descriptions."
    ]
  },
  {
    id: "03",
    icon: Globe2,
    name: "Public Research Engine",
    category: "Federated MCP research · indexed web · public pages",
    status: "Available when configured",
    statusTone: "optional",
    summary: "A separate research path for questions that need evidence from multiple connected read-only tools or public web pages. For configured hiring research, it can expand searches into Google-style query variants, inspect public pages and discover supported company ATS boards.",
    latency: "High · broad searches vary",
    latencyDetail: "Deep research is intentionally more thorough than a single job-board lookup. Search pagination, many query variants, public-page fetches, ATS board lookups and several external MCP calls can all add time. The research worker runs up to six planned tool calls concurrently, but the slowest calls and remote sites still affect completion.",
    steps: [
      "Inspect the tools actually exposed by connected MCP servers and keep only operations identified as read-only.",
      "Use the configured AI planner to select schema-valid tools when an LLM is enabled; otherwise use schema-aware heuristic planning.",
      "For supported hiring research, build role and employer-search queries and send them to the configured public-web crawler.",
      "Fetch a bounded set of public pages, extract structured JobPosting data where available, and query discovered public ATS boards when supported.",
      "Parse, normalize, deduplicate and cap the returned records. Keep each result tied to the server and tool that supplied it, and report failed calls and warnings."
    ],
    inputs: [
      "A natural-language research question and requested scope",
      "The selected connected servers and their read-only tool catalogues",
      "Configured search credentials, public-web limits and provider permissions",
      "A maximum tool-call and record budget"
    ],
    outputs: [
      "Evidence-backed records with connector/tool provenance and source URLs when returned",
      "Per-tool success, failure, duration and record counts",
      "Search/crawl reports, duplicate counts, warnings and coverage information"
    ],
    strengths: [
      "Can research beyond a single job board when the relevant MCP connectors are connected.",
      "Supports public web and company career-page discovery when the search crawler is configured.",
      "Uses actual tool responses and records their source; it does not fill missing results with synthetic examples.",
      "Restricts the research workflow to read-only operations and validates planned arguments against tool schemas."
    ],
    limits: [
      "It can only inspect public pages and systems exposed through connected, authorized tools. It does not log into private accounts or bypass CAPTCHA and access controls.",
      "Search engines cover indexed pages, not the entire live web. A new, blocked or unindexed vacancy may not be found.",
      "A result can be outdated or have changed after indexing. Always open the employer's original page before acting.",
      "The crawler, query count, record count and provider limits are bounded by server configuration; a requested maximum is a ceiling, not a promise that the same number will be returned."
    ]
  },
  {
    id: "04",
    icon: Bot,
    name: "Worker Personal Job Agent",
    category: "Recurring discovery · personalized alerts",
    status: "Roadmap · not active",
    statusTone: "planned",
    summary: "The planned persistent personal agent will turn a saved professional profile and search preferences into recurring discovery. It is intended to find new roles over time rather than waiting for a person to repeat the same search.",
    latency: "Not applicable yet",
    latencyDetail: "This persistent scheduling and alert workflow is a roadmap item in the current product description. There is no verified production latency or service-level promise for it yet.",
    steps: [
      "Use a candidate-approved, saved profile and explicit job preferences.",
      "Run scheduled searches against the sources available to that account.",
      "Compare new listings with previously seen opportunities and the candidate's current preferences.",
      "Present new matches and alerts for the person to review and decide what to do next."
    ],
    inputs: [
      "A saved candidate profile and authorized profile fields",
      "Role, location, remote, salary and schedule preferences",
      "User-approved notification and source permissions"
    ],
    outputs: [
      "A refreshed personal opportunity feed",
      "New-role alerts and duplicate-aware history",
      "A reviewable record of discovered opportunities"
    ],
    strengths: [
      "Could reduce repetitive manual searches.",
      "Could make recommendations more consistent as preferences are maintained.",
      "Keeps the candidate in control of which opportunities to open or apply to."
    ],
    limits: [
      "This is not represented as a live, always-on feature today.",
      "Recurring coverage would still depend on source access, schedules, provider availability and the freshness of the source data.",
      "No automatic application or guaranteed job discovery should be inferred from this roadmap item."
    ]
  },
  {
    id: "05",
    icon: Building2,
    name: "Recruiter Matching Engine",
    category: "Applicant relevance · hiring-team review",
    status: "Roadmap · not active",
    statusTone: "planned",
    summary: "The planned recruiter-side engine will help compare applicants with a published role description. Its purpose is to organize evidence for human review—not to make an automatic hiring decision.",
    latency: "Not applicable yet",
    latencyDetail: "Applicant ranking is still an integration roadmap item in the current Models page. No live scoring throughput, latency or accuracy benchmark is available to publish.",
    steps: [
      "Read a recruiter's role requirements and the candidate information the employer is authorized to review.",
      "Compare required skills, relevant experience and role-specific evidence.",
      "Highlight matching evidence and gaps without filling missing facts with assumptions.",
      "Group applicants for recruiter review, with the employer retaining the final decision."
    ],
    inputs: [
      "A recruiter's job description and required criteria",
      "Applicant data that the employer is authorized to access",
      "Clear job-related evaluation rules"
    ],
    outputs: [
      "Explainable relevance groups and review suggestions",
      "Evidence highlights and missing-information prompts",
      "A human-reviewed shortlist workflow"
    ],
    strengths: [
      "Could help hiring teams organize large applicant pools.",
      "Could make role-related evidence easier to compare.",
      "Keeps hiring decisions with the recruiter rather than an automated score."
    ],
    limits: [
      "This capability is not a verified live applicant-ranking service today.",
      "It requires real applicant APIs, permission controls, transparent evaluation criteria and testing before production use.",
      "An automated score must never be treated as a complete assessment of a person."
    ]
  }
];

export default function ModelsPage() {
  return (
    <div className="catalog-page model-guide-page">
      <header className="catalog-hero model-guide-hero">
        <span className="section-kicker">INSIDE THE WORKER ENGINE</span>
        <h1>How Worker thinks, searches and matches.</h1>
        <p>Understand what each engine does, what information it uses, why some searches take longer, and where its limits are. Worker combines real source retrieval, rule-based checks and optional AI assistance—each has a different job.</p>
        <div className="catalog-meta model-guide-meta">
          <span><ShieldCheck size={14} /> Source-backed results</span>
          <span><Clock3 size={14} /> Latency depends on search scope and providers</span>
          <span><Target size={14} /> Match scores are relevance estimates</span>
        </div>
      </header>

      <section className="default-model-card model-ai-card" aria-labelledby="alpha-model-title">
        <span className="default-model-icon"><BrainCircuit size={23} /></span>
        <div className="default-model-copy">
          <span className="model-label">WORKER'S FIXED AI MODEL PROFILE</span>
          <h2 id="alpha-model-title">Alpha - k1</h2>
          <p>Alpha - k1 is the fixed, Worker-managed AI model profile shown in the product. Users do not switch the underlying model from this page. The Worker server controls its OpenAI-compatible model endpoint and model ID through private deployment settings.</p>
          <div className="model-ai-uses">
            <span><Sparkles size={14} /> Suggests closely related job-title variants</span>
            <span><Workflow size={14} /> Helps plan safe, schema-valid research calls</span>
            <span><Target size={14} /> Optionally reranks leading job matches</span>
            <span><FileSearch size={14} /> Drafts text from supplied profile and job facts</span>
          </div>
          <div className="model-ai-runtime">
            <strong>When does AI assistance run?</strong>
            <p>The worker enables the LLM layer only when both <code>LLM_API_KEY</code> and <code>LLM_MODEL</code> are configured. When they are absent—or an AI request fails—job discovery and matching can continue with deterministic rules, and research falls back to schema-aware planning. The exact provider/model ID is a server-side setting, not a user-facing selector.</p>
          </div>
        </div>
        <span className="default-model-lock"><LockKeyhole size={13} /> Server managed</span>
      </section>

      <section className="model-process-section" aria-labelledby="model-process-title">
        <div className="model-section-heading">
          <span className="section-kicker">THE SEARCH PIPELINE</span>
          <h2 id="model-process-title">One search, several specialised stages.</h2>
          <p>AI is not asked to make up vacancies. Real listings come from connected providers; Worker then checks, compares and ranks the records it receives.</p>
        </div>
        <div className="model-process-grid">
          <article><span className="model-process-number">01</span><span className="model-process-icon"><MapPin size={18} /></span><h3>Your search profile</h3><p>Role, location, skills, experience and work preferences define what should be searched.</p></article>
          <article><span className="model-process-number">02</span><span className="model-process-icon"><Globe2 size={18} /></span><h3>Connected sources</h3><p>Enabled job-search tools are called independently. Provider errors and source coverage are tracked.</p></article>
          <article><span className="model-process-number">03</span><span className="model-process-icon"><Layers3 size={18} /></span><h3>Clean and verify</h3><p>Results are normalized, checked for role and location relevance, and deduplicated.</p></article>
          <article><span className="model-process-number">04</span><span className="model-process-icon"><Target size={18} /></span><h3>Match and rank</h3><p>Deterministic scores are calculated first; optional AI reranking adds another evidence-based signal.</p></article>
        </div>
      </section>

      <section className="model-scope-grid" aria-label="Understanding search scope">
        <article className="model-scope-card">
          <span className="model-scope-icon"><MapPin size={18} /></span>
          <div><h3>City or country search</h3><p>Use a specific city, region or country when you want a focused result set. Source tools receive that location where their search schema supports it, and Worker applies location checks after retrieval.</p></div>
        </article>
        <article className="model-scope-card">
          <span className="model-scope-icon"><Globe2 size={18} /></span>
          <div><h3>Worldwide search</h3><p>A worldwide query has a wider search scope and may return more candidates to filter. It can take longer, especially with public-web crawling. A remote job is not automatically a worldwide job; published country restrictions and eligibility evidence still matter.</p></div>
        </article>
      </section>

      <div className="model-section-heading model-engines-heading">
        <span className="section-kicker">ENGINE REFERENCE</span>
        <h2>Each engine, explained in detail.</h2>
        <p>Active engines describe the current worker pipeline. Optional engines require their connectors and credentials. Roadmap engines are clearly marked and should not be mistaken for live product features.</p>
      </div>

      <section className="model-explainer-list" aria-label="Worker engines">
        {engines.map((item) => {
          const Icon = item.icon;
          return (
            <article className="model-explainer-card" id={"engine-" + item.id} key={item.id}>
              <header className="model-explainer-header">
                <span className="model-explainer-number">{item.id}</span>
                <span className="model-explainer-icon"><Icon size={22} /></span>
                <div className="model-explainer-title">
                  <span className="model-label">{item.category}</span>
                  <h2>{item.name}</h2>
                </div>
                <span className={"model-engine-status model-engine-status-" + item.statusTone}>{item.status}</span>
              </header>

              <div className="model-explainer-overview">
                <div><span className="model-detail-heading">WHAT IT DOES</span><p>{item.summary}</p></div>
                <aside className="model-latency-panel">
                  <span><Clock3 size={14} /> LATENCY EXPECTATION</span>
                  <strong>{item.latency}</strong>
                  <p>{item.latencyDetail}</p>
                </aside>
              </div>

              <div className="model-explainer-columns">
                <section className="model-explainer-block">
                  <h3><Workflow size={15} /> How it works</h3>
                  <ol>{item.steps.map((step, index) => <li key={index}><span>{String(index + 1).padStart(2, "0")}</span><p>{step}</p></li>)}</ol>
                </section>
                <section className="model-explainer-block">
                  <h3><Database size={15} /> Inputs and outputs</h3>
                  <div className="model-io-group"><strong>INPUTS</strong><ul>{item.inputs.map((value) => <li key={value}>{value}</li>)}</ul></div>
                  <div className="model-io-group"><strong>OUTPUTS</strong><ul>{item.outputs.map((value) => <li key={value}>{value}</li>)}</ul></div>
                </section>
              </div>

              {item.id === "02" && (
                <section className="model-score-structure">
                  <div>
                    <span className="model-detail-heading">DETERMINISTIC SCORE SIGNALS</span>
                    <h3>What contributes to the initial match score?</h3>
                    <p>The scoring layer starts at 25 and adds the available evidence below. The total is capped at 100; unavailable fields do not become verified facts.</p>
                  </div>
                  <div className="model-score-parts">
                    <span><strong>Up to +35</strong><small>Matching skills and keywords · 7 points per matching term, capped</small></span>
                    <span><strong>Up to +25</strong><small>Overlap between the requested job title and the listing title</small></span>
                    <span><strong>+10</strong><small>Location match, or remote preference when remote work is evidenced</small></span>
                    <span><strong>Up to +10</strong><small>Published salary range overlaps the candidate's stated range</small></span>
                  </div>
                  <p className="model-score-blend">When AI reranking is enabled, Worker blends 45% of the deterministic score with 55% of the AI score for the leading candidates. If an AI batch fails, the deterministic score is retained.</p>
                </section>
              )}

              <div className="model-pros-cons">
                <section className="model-pros">
                  <h3><CheckCircle2 size={15} /> Strengths</h3>
                  <ul>{item.strengths.map((value) => <li key={value}>{value}</li>)}</ul>
                </section>
                <section className="model-cons">
                  <h3><AlertTriangle size={15} /> Limitations and trade-offs</h3>
                  <ul>{item.limits.map((value) => <li key={value}>{value}</li>)}</ul>
                </section>
              </div>
            </article>
          );
        })}
      </section>

      <section className="model-latency-guide" aria-labelledby="latency-guide-title">
        <div className="model-latency-guide-heading">
          <span className="model-scope-icon"><Clock3 size={19} /></span>
          <div><span className="section-kicker">WHY SOME SEARCHES ARE SLOWER</span><h2 id="latency-guide-title">Latency is a coverage trade-off.</h2></div>
        </div>
        <div className="model-latency-guide-grid">
          <div><strong>More sources</strong><p>Worker searches connected providers in parallel, but the slowest provider can hold the overall response open. Provider rate limits and network health also matter.</p></div>
          <div><strong>More geography</strong><p>Worldwide scope can expand the candidate pool and the amount of location eligibility evidence to evaluate. A city or country query is usually a narrower task.</p></div>
          <div><strong>More verification</strong><p>Public-page crawling, ATS board discovery, job-detail enrichment and optional AI scoring add extra external calls after or around the initial search.</p></div>
        </div>
        <p className="model-latency-footnote">There is no fixed response-time guarantee on this page. Actual latency changes with the selected scope, connected source count, provider response times, crawler limits, AI configuration and network conditions. Worker records per-source duration and errors where the source workflow exposes them.</p>
      </section>

      <section className="model-accuracy-note" aria-labelledby="model-accuracy-title">
        <span className="model-accuracy-icon"><ShieldCheck size={21} /></span>
        <div>
          <span className="section-kicker">ACCURACY AND DATA INTEGRITY</span>
          <h2 id="model-accuracy-title">Designed for evidence. Not a false 100% promise.</h2>
          <p>No job-search system can honestly guarantee that 100% of external listings are current, correctly described, eligible for a particular location and a perfect fit. Worker uses role and location checks, normalization, duplicate handling, match reasons and optional AI reranking to improve relevance. However, the quality of the result still depends on the information supplied by each job source.</p>
          <div className="model-accuracy-points">
            <span><CheckCircle2 size={14} /> Real provider records, not generated vacancies</span>
            <span><CheckCircle2 size={14} /> Source attribution and original links when supplied</span>
            <span><CheckCircle2 size={14} /> Deterministic matching retained when AI is unavailable</span>
            <span><XCircle size={14} /> No guarantee of perfect coverage or hiring outcomes</span>
          </div>
          <p className="model-score-warning">A match score is a ranking aid—not a probability of getting hired, a verified qualification assessment or a substitute for reading the original job description.</p>
        </div>
      </section>

      <section className="catalog-callout model-guide-cta">
        <div><strong>Ready to see the engines in action?</strong><p>Search a role and location, then review the source links and match reasons behind the results.</p></div>
        <Link href="/">Find jobs <ArrowUpRight size={15} /></Link>
      </section>
    </div>
  );
}

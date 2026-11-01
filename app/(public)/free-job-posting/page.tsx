import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  Building2,
  Check,
  CircleDollarSign,
  ListFilter,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  Target,
  Users
} from "lucide-react";

export const metadata: Metadata = {
  title: "100% Free Job Posting for Employers | Worker",
  description: "Create your company profile and post jobs for free with Worker. Reduce weeks of manual hiring work with organised applicant review and AI-assisted matching.",
  keywords: ["free job posting", "post jobs for free", "free hiring platform", "AI applicant matching", "employer hiring workspace"]
};

const processSteps = [
  {
    number: "01",
    icon: Building2,
    title: "Register your company",
    description: "Create your employer account, add your company details and set up the place where your hiring activity belongs."
  },
  {
    number: "02",
    icon: SearchCheck,
    title: "Publish the role",
    description: "Add the job title, responsibilities, required skills, experience and location. Give Worker a clear picture of the person you need."
  },
  {
    number: "03",
    icon: BrainCircuit,
    title: "Let Worker organise the review",
    description: "Worker is designed to compare available candidate information with your requirements, sort relevant profiles and explain the signals behind a potential match."
  }
];

const matchingBenefits = [
  {
    icon: ListFilter,
    title: "Bring the review into focus",
    description: "Spend less time jumping between tabs and manually arranging candidate details. Keep role-related information together for a more consistent review."
  },
  {
    icon: Target,
    title: "See why a profile may fit",
    description: "Compare the available skills, experience and other role requirements. Understand the strengths and the missing information before moving someone forward."
  },
  {
    icon: Users,
    title: "Choose the people who fit your team",
    description: "Use Worker’s suggested relevance to prioritise your shortlist, then review profiles and make the final decision yourself."
  }
];


const included = [
  "Create and manage your company presence",
  "Publish job vacancies with a ₹0 Worker posting fee",
  "Keep hiring activity connected to your company",
  "Use available applicant and matching tools as they roll out"
];

const questions = [
  {
    question: "Is job posting really 100% free?",
    answer: "Worker charges no platform fee for core job posting. If you choose an external service or integration that has its own separate charges, those terms are set by that provider."
  },
  {
    question: "How does Worker help with candidate matching?",
    answer: "Worker is being built to compare available candidate information with the role requirements, organise profiles by relevance and show the signals behind a suggested fit. You review the evidence and decide who to contact or hire."
  },
  {
    question: "Will Worker automatically hire someone?",
    answer: "No. Worker can support discovery and candidate review, but it does not make hiring decisions. Your team remains in control of screening, interviews and offers."
  },
  {
    question: "How do I get started?",
    answer: "Create an employer account, register your company and complete the company details. You can then set up the roles you want to publish through the employer workspace."
  }
];

export default function FreeJobPostingPage() {
  return (
    <main className="free-hiring-page">
      <div className="free-hiring-breadcrumb"><Link href="/">Worker</Link><span>/</span><strong>For employers</strong></div>

      <section className="free-hiring-hero">
        <div className="free-hiring-hero-copy">
          <div className="free-hiring-eyebrow">
            <span>WORKER FOR EMPLOYERS</span>
            <strong><CircleDollarSign size={14} /> 100% FREE JOB POSTING</strong>
          </div>
          <h1>Stop spending weeks sorting applications. Let Worker help you find the right people.</h1>
          <p className="free-hiring-hero-lead">Register your company, publish jobs for ₹0 and give your hiring process a smarter starting point. Worker is designed to organise relevant candidates, compare role-fit signals and bring the profiles worth reviewing into focus.</p>
          <div className="free-hiring-actions">
            <Link href="/auth/register?role=3" className="free-hiring-primary-action">Register your company <ArrowRight size={17} /></Link>
            <a href="#how-it-works" className="free-hiring-secondary-action">See how it works</a>
          </div>
          <div className="free-hiring-trust-line"><Check size={14} /> No Worker job-posting fee <span /> <Check size={14} /> Human-led hiring decisions</div>
        </div>

        <div className="free-hiring-preview-wrap">
          <div className="free-hiring-preview-glow" />
          <div className="free-hiring-preview">
            <div className="free-hiring-preview-top">
              <span className="free-hiring-preview-brand"><span><Sparkles size={15} /></span> WORKER MATCH REVIEW</span>
              <span className="free-hiring-preview-tag">ILLUSTRATIVE</span>
            </div>
            <div className="free-hiring-preview-heading">
              <div><span>EXAMPLE ROLE</span><h2>Product Designer</h2><p>Candidate review · role requirements</p></div>
              <span className="free-hiring-preview-count">03 <small>profiles</small></span>
            </div>
            <div className="free-hiring-preview-list">
              <article className="free-hiring-candidate is-highlighted">
                <span className="free-hiring-candidate-rank">01</span>
                <div><strong>Strong role alignment</strong><p>Skills and experience closely match the role brief</p><small><Check size={11} /> Suggested for first review</small></div>
                <BadgeCheck size={18} />
              </article>
              <article className="free-hiring-candidate">
                <span className="free-hiring-candidate-rank">02</span>
                <div><strong>Relevant experience</strong><p>Several required skills are present</p><small>Review remaining requirements</small></div>
                <ArrowRight size={16} />
              </article>
              <article className="free-hiring-candidate">
                <span className="free-hiring-candidate-rank">03</span>
                <div><strong>More information needed</strong><p>Some role requirements are not shown</p><small>Check the full candidate profile</small></div>
                <ArrowRight size={16} />
              </article>
            </div>
            <div className="free-hiring-preview-foot"><ShieldCheck size={14} /> Example layout only · your team makes every decision</div>
          </div>
          <p className="free-hiring-preview-caption">A clearer shortlist starts with the requirements that matter.</p>
        </div>
      </section>

      <section className="free-hiring-value-strip" aria-label="Worker employer benefits">
        <div><strong>₹0</strong><span>Worker job-posting fee</span></div>
        <div><strong>One workspace</strong><span>Company and hiring activity</span></div>
        <div><strong>More focus</strong><span>Review relevant profiles first</span></div>
      </section>

      <section className="free-hiring-section" id="how-it-works">
        <div className="free-hiring-section-heading">
          <span>HOW IT WORKS</span>
          <h2>Set up the role. Let Worker help with the sorting.</h2>
          <p>You should not have to lose weeks repeating the same manual checks. Give Worker the role requirements and keep your attention on the candidates who deserve a closer look.</p>
        </div>
        <div className="free-hiring-steps">
          {processSteps.map((step) => {
            const Icon = step.icon;
            return <article className="free-hiring-step" key={step.number}>
              <div className="free-hiring-step-top"><span>{step.number}</span><Icon size={21} /></div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </article>;
          })}
        </div>
      </section>

      <section className="free-hiring-agent-section">
        <div className="free-hiring-agent-copy">
          <span>LET WORKER TAKE ON THE REPETITIVE WORK</span>
          <h2>Find the stronger matches. Understand the difference. Choose confidently.</h2>
          <p>Instead of treating every application as an isolated task, Worker is designed to help your team look at candidates against the same role requirements. It can bring relevant profiles forward, make the available match signals easier to compare and help you decide who should be reviewed first.</p>
          <p className="free-hiring-agent-note">A match is guidance, not a hiring verdict. Your recruiters stay in charge of every shortlist, interview and offer.</p>
          <Link href="/auth/register?role=3">Create your employer account <ArrowRight size={16} /></Link>
        </div>
        <div className="free-hiring-agent-points">
          {matchingBenefits.map((item, index) => {
            const Icon = item.icon;
            return <article key={item.title}>
              <span className="free-hiring-agent-icon"><Icon size={19} /></span>
              <div><span>0{index + 1}</span><h3>{item.title}</h3><p>{item.description}</p></div>
            </article>;
          })}
        </div>
      </section>

      <section className="free-hiring-included-section">
        <div className="free-hiring-section-heading">
          <span>WHAT IS INCLUDED</span>
          <h2>Build your hiring presence without a posting bill.</h2>
          <p>Start with your company registration and job details. Core job posting on Worker is free.</p>
        </div>
        <div className="free-hiring-included-layout">
          <div className="free-hiring-free-card">
            <span>WORKER EMPLOYER ACCESS</span>
            <strong>₹0</strong>
            <h3>100% free job posting</h3>
            <p>No Worker platform fee to publish a core job listing.</p>
            <Link href="/auth/register?role=3">Get started for free <ArrowRight size={16} /></Link>
          </div>
          <div className="free-hiring-included-list">
            {included.map((item) => <div key={item}><Check size={17} /><span>{item}</span></div>)}
          </div>
        </div>
      </section>

      <section className="free-hiring-faq-section">
        <div className="free-hiring-section-heading">
          <span>EMPLOYER QUESTIONS</span>
          <h2>Everything you need to get started.</h2>
        </div>
        <div className="free-hiring-faq-list">
          {questions.map((item, index) => <details key={item.question} open={index === 0}>
            <summary>{item.question}<span>+</span></summary>
            <p>{item.answer}</p>
          </details>)}
        </div>
      </section>

      <footer className="free-hiring-final-cta">
        <div><span>YOUR NEXT HIRE STARTS HERE</span><h2>Register your company. Post your job. Let Worker help you move forward.</h2><p>Start with a free employer account and build your hiring workflow around the people your team needs.</p></div>
        <Link href="/auth/register?role=3">Start hiring for free <ArrowRight size={17} /></Link>
      </footer>

      <p className="free-hiring-disclaimer"><ShieldCheck size={14} /> Worker does not charge a platform fee for core job posting. Employer workspace and AI-assisted candidate matching are being connected to the hiring experience; availability of individual tools depends on the production rollout and configured integrations. Candidate relevance is guidance only and does not replace human review.</p>
    </main>
  );
}

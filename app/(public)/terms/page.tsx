import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Review the terms for using Worker's job discovery, professional profile and employer hiring services."
};

export default function TermsPage() {
  return <InfoPage kind="legal" eyebrow="WORKER / TERMS" title="Terms of Service" description="These terms outline the expected use of Worker's job discovery and hiring services. The operating entity, governing law and formal contractual details require operator and legal review before these terms are treated as binding." updated="1 November 2026" sections={[
    { title: "Using Worker", body: "Worker provides job discovery, professional profiles, matching assistance and employer hiring tools. Users must provide accurate information and use the platform only for lawful employment and recruitment purposes." },
    { title: "Candidate responsibilities", body: "Candidates are responsible for the accuracy of their profile, resume and application information. A job recommendation is not a guarantee that a vacancy remains open, that an employer will respond or that an application will be accepted." },
    { title: "Employer responsibilities", body: "Employers must have authority to publish vacancies, provide accurate job descriptions, disclose relevant employment conditions and use candidate information only for legitimate recruitment purposes. Discriminatory, misleading or fraudulent listings are prohibited." },
    { title: "External job sources", body: "Some opportunities may originate from third-party platforms or public employer pages. Their original source and application destination remain authoritative. Worker does not control external employers, listings, hiring decisions or third-party website availability." },
    { title: "AI-assisted recommendations", body: "AI-generated matches and applicant groupings are decision-support information. They can be incomplete or inaccurate and must be reviewed by users. Recruiters remain responsible for hiring decisions." },
    { title: "Acceptable use", body: "Users must not scrape or misuse the platform, impersonate another person or company, upload malicious content, interfere with service operation or use candidate information outside authorized hiring purposes." },
    { title: "Availability and changes", body: "Features, sources and integrations may change or be temporarily unavailable. Worker should not be used as the sole source for time-sensitive job status or application deadlines." },
    { title: "Operator details", body: "The operating legal entity, registered address, governing law, dispute process, liability terms and formal contact details must be supplied by the operator and reviewed by qualified counsel before these terms become binding." }
  ]} />;
}

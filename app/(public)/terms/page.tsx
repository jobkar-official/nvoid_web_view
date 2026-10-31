import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = { title: "Terms of Service — Nvoid", description: "Terms for using Nvoid job discovery and hiring services." };

export default function TermsPage() {
  return <InfoPage eyebrow="LEGAL" title="Terms of Service" description="These terms describe the intended rules for using Nvoid. They require legal review and final operator details before production use." updated="October 31, 2026" sections={[
    { title: "Using Nvoid", body: "Nvoid provides job discovery, professional profiles, matching assistance and employer hiring tools. Users must provide accurate information and use the platform only for lawful employment and recruitment purposes." },
    { title: "Candidate responsibilities", body: "Candidates are responsible for the accuracy of their profile, resume and application information. A job recommendation is not a guarantee that a vacancy remains open, that an employer will respond or that an application will be accepted." },
    { title: "Employer responsibilities", body: "Employers must have authority to publish vacancies, provide accurate job descriptions, disclose relevant employment conditions and use candidate information only for legitimate recruitment purposes. Discriminatory, misleading or fraudulent listings are prohibited." },
    { title: "External job sources", body: "Some opportunities may originate from third-party platforms or public employer pages. Their original source and application destination remain authoritative. Nvoid does not control external employers, listings, hiring decisions or third-party website availability." },
    { title: "AI-assisted recommendations", body: "AI-generated matches and applicant groupings are decision-support information. They can be incomplete or inaccurate and must be reviewed by users. Recruiters remain responsible for hiring decisions." },
    { title: "Acceptable use", body: "Users must not scrape or misuse the platform, impersonate another person or company, upload malicious content, interfere with service operation or use candidate information outside authorized hiring purposes." },
    { title: "Availability and changes", body: "Features, sources and integrations may change or be temporarily unavailable. Nvoid should not be used as the sole source for time-sensitive job status or application deadlines." },
    { title: "Operator details", body: "The operating legal entity, registered address, governing law, dispute process, liability terms and formal contact details must be inserted and reviewed by qualified counsel before these terms become binding." }
  ]} />;
}

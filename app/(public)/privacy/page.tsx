import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = { title: "Privacy Policy — Nvoid", description: "How Nvoid is designed to handle account, profile, search and application information." };

export default function PrivacyPage() {
  return <InfoPage eyebrow="LEGAL" title="Privacy Policy" description="This page explains the intended privacy principles for Nvoid. The final policy must be aligned with the deployed authentication, database, analytics, email and AI-provider configuration before production launch." updated="October 31, 2026" sections={[
    { title: "Information you provide", body: "Nvoid may process account details, professional profile information, skills, education, experience, projects, resume information, job preferences, company details, job postings, applications and support messages when those features are enabled." },
    { title: "Search and agent activity", body: "Job-search queries and agent activity may be processed to return opportunities and maintain a user's search or recommendation history. Guest search history in this web interface is stored in the browser's local storage and can be deleted from the sidebar." },
    { title: "Sources and external services", body: "Job discovery may use connected third-party job sources, MCP services, public websites, hosting providers and communication services. External listings keep their source attribution and application destination. Each integration must be configured with appropriate permissions." },
    { title: "How information is used", body: "Information is used to provide job discovery, profile matching, recruiter workflows, notifications, account support, platform reliability and security. Candidate information should only be made available to recruiters according to the product's account, application and privacy controls." },
    { title: "Retention and deletion", body: "Account, profile, application, search and message retention periods depend on the deployed services and applicable legal requirements. Before public launch, Nvoid must publish the exact retention periods, deletion process and responsible data controller details." },
    { title: "Your choices and rights", body: "Users should be able to access and correct their profile information, control visibility where supported, manage communications and request account or data deletion through the production support process." },
    { title: "Policy owner and contact", body: "The operator's legal entity, registered address, privacy contact and jurisdiction-specific rights must be added to this page before it is treated as the final legal policy." }
  ]} />;
}

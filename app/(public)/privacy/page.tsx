import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = {
  title: "Privacy Policy — Worker",
  description: "Read how Worker handles account, professional profile, search, application and employer information."
};

export default function PrivacyPage() {
  return <InfoPage kind="legal" eyebrow="WORKER / PRIVACY" title="Privacy Policy" description="This notice explains the information Worker may process to provide job discovery, professional profiles and employer hiring features. Product-specific handling depends on the services and integrations enabled in the deployed environment." updated="1 November 2026" sections={[
    { title: "Information you provide", body: "Worker may process account details, professional profile information, skills, education, experience, projects, resume information, job preferences, company details, job postings, applications and support messages when those features are enabled." },
    { title: "Search and agent activity", body: "Job-search queries and agent activity may be processed to return opportunities and maintain a user's search or recommendation history. Guest search history in the public web interface is stored in the browser's local storage and can be deleted from the sidebar." },
    { title: "Sources and external services", body: "Job discovery may use connected third-party job sources, MCP services, public websites, hosting providers and communication services. External listings retain their source attribution and application destination. Each integration should be configured with appropriate permissions." },
    { title: "How information is used", body: "Information may be used to provide job discovery, profile matching, recruiter workflows, notifications, account support, platform reliability and security. Candidate information should only be made available to recruiters according to the account, application and privacy controls implemented in the production service." },
    { title: "Retention and deletion", body: "Account, profile, application, search and message retention periods depend on the deployed services and applicable legal requirements. The production operator should publish the applicable retention periods, deletion process and responsible data-controller details before treating this notice as a complete jurisdiction-specific policy." },
    { title: "Your choices and rights", body: "Users should be able to access and correct their profile information, control visibility where supported, manage communications and request account or data deletion through the production support process. Available controls depend on the deployed account experience." },
    { title: "Policy owner and contact", body: "The operating legal entity, registered address, privacy contact and jurisdiction-specific rights must be supplied by the platform operator and reviewed before this page is treated as the final legal policy." }
  ]} />;
}

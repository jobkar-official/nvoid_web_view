import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = {
  title: "Security & Responsible Disclosure — Worker",
  description: "Learn about Worker's security principles, service boundaries, account protections and responsible vulnerability reporting."
};

export default function SecurityPage() {
  return <InfoPage kind="legal" accent="green" eyebrow="WORKER / TRUST & SAFETY" title="Security is part of the product." description="Worker connects candidate information, employer workflows and external job sources. The platform's security approach focuses on protecting those boundaries and being clear about what has—and has not—been verified." updated="1 November 2026" sections={[
    { title: "Private service connections", body: "The current web interface routes agent requests through server-side Next.js endpoints. The agent API key is read on the server and is not intended to be exposed in browser JavaScript." },
    { title: "Account and role boundaries", body: "Production authentication must verify sessions on the server and enforce role permissions for candidate, recruiter and support operations. Hiding a page in the browser is not a substitute for backend authorization." },
    { title: "Candidate and employer data", body: "Professional profiles, resumes, applications, messages and company records require access controls appropriate to their sensitivity. Public job pages should not expose private candidate data." },
    { title: "External integrations", body: "MCP credentials, provider tokens and agent configuration belong in private server-side configuration. Users should only connect services they are authorized to use." },
    { title: "Responsible vulnerability reporting", body: "If you identify a security issue, stop testing once the issue is confirmed and report the minimum information needed through the official Worker support channel. Do not access, alter or disclose another person's data." },
    { title: "Security transparency", body: "Encryption, backup, monitoring, incident response, vulnerability management and retention commitments must reflect the actual production infrastructure. This page does not claim controls that have not been independently verified." }
  ]} />;
}

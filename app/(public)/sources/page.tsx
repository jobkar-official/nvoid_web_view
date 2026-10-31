import type { Metadata } from "next";
import WorkerDirectory, { type WorkerDirectoryConfig } from "../../../components/worker-directory";

export const metadata: Metadata = {
  title: "Job Sources — Worker",
  description: "Browse Worker job-board feeds, optional provider connectors and supported career-page platforms."
};

const config: WorkerDirectoryConfig = {
  eyebrow: "WORKER / JOB SOURCES",
  title: "Explore the connected job market.",
  description: "A directory of the job feeds and provider integrations documented for Worker. Browse default public feeds separately from optional connectors and career platforms.",
  categories: ["Default feeds", "Optional providers", "Career platforms"],
  entries: [
    ...[
      ["Jobicy", "A default public job feed included in the documented Worker source set."],
      ["Remote OK", "A default public job feed for remote-oriented opportunities."],
      ["Arbeitnow", "A default public job feed included in the documented Worker source set."],
      ["Working Nomads", "A default public job feed included in the documented Worker source set."],
      ["Himalayas", "A default public job feed included in the documented Worker source set."]
    ].map(([name, description]) => ({
      name,
      category: "Default feeds",
      kind: "Public feed",
      status: "Default source",
      description,
      detail: "Included in the five documented default public feeds. Returned listings depend on the provider response and current availability.",
      icon: "globe" as const
    })),
    ...[
      ["Naukri", "Optional job-board integration for India-focused opportunities."],
      ["LinkedIn Jobs", "Optional job-board integration when its configured connector and credentials are available."],
      ["Indeed", "Optional job-board integration when its configured connector and credentials are available."],
      ["Glassdoor", "Optional job-board integration when its configured connector and credentials are available."],
      ["Apna", "Optional job-board integration for India-focused opportunities."],
      ["Adzuna", "Optional API connector that requires its own credentials."],
      ["Jooble", "Optional API connector that requires its own credentials."]
    ].map(([name, description]) => ({
      name,
      category: "Optional providers",
      kind: "Optional connector",
      status: "Configuration required",
      description,
      detail: "This connector is not guaranteed to be active on every Worker deployment. Availability depends on credentials, source access and worker configuration.",
      icon: "network" as const
    })),
    ...[
      ["Greenhouse", "Career-page platform supported through configured discovery connectors."],
      ["Lever", "Career-page platform supported through configured discovery connectors."],
      ["Ashby", "Career-page platform supported through configured discovery connectors."]
    ].map(([name, description]) => ({
      name,
      category: "Career platforms",
      kind: "Career platform",
      status: "Connector dependent",
      description,
      detail: "Worker can include publicly accessible employer career pages when the corresponding source adapter is configured.",
      icon: "briefcase" as const
    }))
  ],
  note: "This is a capability directory, not a live connection-status panel. A source listed here may require an API key, Apify actor, MCP server, regional access or additional worker configuration before it can return results."
};

export default function SourcesPage() {
  return <WorkerDirectory config={config} />;
}

import type { Metadata } from "next";
import WorkerDirectory, { type WorkerDirectoryConfig } from "../../../components/worker-directory";

export const metadata: Metadata = {
  title: "Worker — AI Agent Runtime",
  description: "Explore the Worker agent runtime, job discovery, matching, research and review-first workflows."
};

const config: WorkerDirectoryConfig = {
  eyebrow: "WORKER / OVERVIEW",
  title: "One worker. Connected opportunity discovery.",
  description: "Explore the runtime and capabilities that power multi-source job discovery, profile relevance, public research and human-reviewed workflows.",
  categories: ["Runtime", "Discovery", "Intelligence", "Research", "Safety"],
  entries: [
    {
      name: "Worker agent runtime",
      category: "Runtime",
      kind: "Core service",
      status: "Separate worker service",
      description: "The execution engine behind the web interface. It coordinates job discovery, connected tools, source processing and research workflows.",
      detail: "The web application communicates with the worker through a server-side API proxy.",
      icon: "cpu",
      href: "/plugins",
      linkLabel: "Explore tools"
    },
    {
      name: "Multi-source discovery",
      category: "Discovery",
      kind: "Job search",
      status: "Current capability",
      description: "Searches compatible job providers and configured public feeds in one request, then returns normalized opportunity records.",
      detail: "The documented default public feed set includes Jobicy, Remote OK, Arbeitnow, Working Nomads and Himalayas.",
      icon: "globe",
      href: "/sources",
      linkLabel: "Browse sources"
    },
    {
      name: "MCP tool orchestration",
      category: "Runtime",
      kind: "Extensible tools",
      status: "Configuration dependent",
      description: "Connects tools exposed by configured Model Context Protocol servers and selects compatible tools for supported requests.",
      detail: "Available tools depend on each server's configuration, schemas, permissions and credentials.",
      icon: "network",
      href: "/plugins",
      linkLabel: "Browse plugins"
    },
    {
      name: "Profile relevance matching",
      category: "Intelligence",
      kind: "Ranking",
      status: "Current capability",
      description: "Uses available role, location, skill and experience signals to rank opportunities and explain relevance where the source data supports it.",
      detail: "A match score is an indicator of relevance, not a guarantee of eligibility or an interview.",
      icon: "brain"
    },
    {
      name: "Public research",
      category: "Research",
      kind: "Read-only research",
      status: "Provider configuration required",
      description: "Uses connected read-only MCP tools and public-web research to investigate employers, career pages and source-backed hiring information.",
      detail: "Google-indexed search requires SERPER_API_KEY on the worker. Connected MCP tools require their own credentials and permissions.",
      icon: "search",
      href: "/plugins",
      linkLabel: "Explore research tools"
    },
    {
      name: "Review-first workflow",
      category: "Safety",
      kind: "Human review",
      status: "Submission disabled",
      description: "Search and research results are presented for people to inspect. A visible listing or queued task is not treated as proof that an application was submitted.",
      detail: "Public guest search sends syncToBackend: false. Automated submission must remain separately authorized and disabled until its destination workflow is verified.",
      icon: "shield"
    },
    {
      name: "Alpha - k1",
      category: "Intelligence",
      kind: "Default model",
      status: "Fixed default",
      description: "The model displayed as the default Worker model in the interface. Model selection is managed by the service rather than by the user.",
      detail: "The current UI does not expose a model switcher.",
      icon: "cpu",
      href: "/models",
      linkLabel: "Model details"
    }
  ],
  note: "This catalogue describes capabilities visible in the current project and its setup documentation. Provider availability and research depth depend on the worker deployment, configuration, credentials and source permissions."
};

export default function WorkerPage() {
  return <WorkerDirectory config={config} />;
}

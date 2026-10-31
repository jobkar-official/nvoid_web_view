import type { Metadata } from "next";
import WorkerDirectory, { type WorkerDirectoryConfig } from "../../../components/worker-directory";

export const metadata: Metadata = {
  title: "Plugins & MCP Integrations — Worker",
  description: "Explore Worker MCP tool integrations, read-only research connectors, search and crawling capabilities."
};

const config: WorkerDirectoryConfig = {
  eyebrow: "WORKER / PLUGINS & INTEGRATIONS",
  title: "Extend Worker with connected tools.",
  description: "Worker can use tools exposed by configured Model Context Protocol servers. Explore the integration types and research capabilities supported by the current architecture.",
  categories: ["MCP connectors", "Research tools", "Worker capabilities"],
  entries: [
    {
      name: "Job-search MCP tools",
      category: "MCP connectors",
      kind: "MCP integration",
      status: "Configured per deployment",
      description: "Connect job-search tools from MCP servers. Worker selects compatible tools and can run supported sources as part of one discovery request.",
      detail: "Tool names, schemas and availability are provided by each connected MCP server.",
      icon: "puzzle",
      href: "/sources",
      linkLabel: "View job sources"
    },
    {
      name: "Research MCP tools",
      category: "MCP connectors",
      kind: "MCP integration",
      status: "Configured per deployment",
      description: "Use read-only tools from configured MCP servers for company, hiring and public-information research.",
      detail: "Only tools exposed by the connected servers and allowed by the worker's read-only policy can be used.",
      icon: "network"
    },
    {
      name: "Public-web search",
      category: "Research tools",
      kind: "Search provider",
      status: "Requires SERPER_API_KEY",
      description: "Adds Google-indexed public-web discovery to the worker's research workflow.",
      detail: "The key is configured server-side on the worker. It is not exposed to browser JavaScript.",
      icon: "globe"
    },
    {
      name: "Bounded public-page crawling",
      category: "Research tools",
      kind: "Crawler",
      status: "Provider configuration required",
      description: "Opens accessible public pages to collect relevant evidence and structured information for a research request.",
      detail: "Crawling is bounded and limited to publicly accessible pages and permitted read-only workflows.",
      icon: "database"
    },
    {
      name: "Schema-aware tool planning",
      category: "Worker capabilities",
      kind: "Tool planner",
      status: "Current worker capability",
      description: "Plans tool calls from the names, descriptions and input schemas exposed by configured MCP servers.",
      detail: "LLM-assisted planning requires the worker's model configuration; a bounded schema-based fallback is available.",
      icon: "workflow"
    },
    {
      name: "Source diagnostics",
      category: "Worker capabilities",
      kind: "Observability",
      status: "Current worker capability",
      description: "Reports configured sources, connection status, tool execution errors and returned record counts.",
      detail: "Diagnostics describe the current worker configuration and the responses actually received.",
      icon: "shield"
    },
    {
      name: "Normalization & deduplication",
      category: "Worker capabilities",
      kind: "Data processing",
      status: "Current worker capability",
      description: "Normalizes records from multiple providers, removes duplicates where stable identifiers allow and preserves original result URLs.",
      detail: "The fields available in a normalized record still depend on what each source returns.",
      icon: "layers"
    }
  ],
  note: "Worker does not assume that a plugin is installed just because it is listed here. MCP integrations and optional search providers must be configured and authorized on the worker service first."
};

export default function PluginsPage() {
  return <WorkerDirectory config={config} />;
}

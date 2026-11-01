import type { Metadata } from "next";
import AgentResearch from "../../../components/agent-research";

export const metadata: Metadata = {
  title: "Research Anything",
  description: "Run read-only multi-source research across the MCP tools connected to Nvoid Agent.",
  robots: { index: false, follow: false }
};

export default function ResearchPage() {
  return <AgentResearch />;
}

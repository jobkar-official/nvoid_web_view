import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agent Connections",
  description: "Inspect Nvoid Agent health, live MCP connections, searchable sources and available tools.",
  robots: { index: false, follow: false }
};

export default function ConnectionsPage() {
  return <div>Connections Page</div>;
}

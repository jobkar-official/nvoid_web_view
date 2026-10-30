import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  return requestAgent("/api/mcp/tools", { method: "GET", timeoutMs: 30_000 });
}

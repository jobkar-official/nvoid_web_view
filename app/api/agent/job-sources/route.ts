import { requestAgent } from "@/lib/agent-proxy";

export const dynamic = "force-dynamic";

export async function GET() {
  return requestAgent("/api/jobs/sources", { method: "GET" });
}

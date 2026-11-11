import { GET as handleGet } from "@/lib/agent/job-sources/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleGet();
}
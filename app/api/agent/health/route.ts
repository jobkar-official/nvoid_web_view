import { GET as handleGet } from "@/lib/agent/health/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleGet();
}
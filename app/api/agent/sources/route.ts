import { GET as handleGet } from "@/lib/agent/sources/route";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleGet();
}
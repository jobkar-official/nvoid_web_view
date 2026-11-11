import { GET as handleGet } from "@/lib/agent/applications/[taskId]/route";

type RouteContext = { params: Promise<{ taskId: string }> };

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: RouteContext) {
  return handleGet(request, context);
}
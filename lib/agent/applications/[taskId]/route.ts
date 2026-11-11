import { requestAgent } from "@/lib/agent-proxy";

type RouteContext = { params: Promise<{ taskId: string }> };

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext) {
  const { taskId } = await context.params;
  if (!taskId || taskId.length > 240 || /[\\/]/.test(taskId)) {
    return Response.json({ error: "Invalid task identifier." }, { status: 400 });
  }
  return requestAgent(`/api/applications/tasks/${encodeURIComponent(taskId)}`, { method: "GET" });
}

import { NextRequest } from "next/server";
import { handleAuthRequest } from "../../../../lib/server/auth-route";

export async function POST(request: NextRequest, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  return handleAuthRequest(request, action);
}

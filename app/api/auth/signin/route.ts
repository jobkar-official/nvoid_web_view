import { NextRequest } from "next/server";
import { handleAuthRequest } from "../../../../lib/server/auth-route";

export async function POST(request: NextRequest) {
  return handleAuthRequest(request, "signin");
}

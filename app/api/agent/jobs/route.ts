import { NextRequest } from "next/server";
import { GET as handleGet } from "@/lib/agent/jobs/route";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  return handleGet(request);
}
import { NextRequest } from "next/server";
import { GET as handleGet } from "@/lib/agent/index-jobs/route";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

export async function GET(request: NextRequest) {
  return handleGet(request);
}
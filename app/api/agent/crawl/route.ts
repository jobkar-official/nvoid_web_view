import { NextRequest } from "next/server";
import { POST as handlePost } from "@/lib/agent/crawl/route";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  return handlePost(request);
}
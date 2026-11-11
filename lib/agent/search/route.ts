import { NextRequest } from "next/server";
import { POST as crawl } from "../crawl/route";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return crawl(request);
}

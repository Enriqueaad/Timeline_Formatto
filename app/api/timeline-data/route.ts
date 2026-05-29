import { NextResponse } from "next/server";
import { getTimelineData } from "@/lib/timeline-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await getTimelineData();
  return NextResponse.json(data);
}

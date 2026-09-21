import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = getCatalog();
  return NextResponse.json({
    ok: true,
    service: "skillforge",
    version: "1.0.0",
    time: new Date().toISOString(),
    catalog: catalog.length,
    feeds: ["github", "hn"],
    mcp: "/api/mcp",
  });
}

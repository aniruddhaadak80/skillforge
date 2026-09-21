import { NextResponse } from "next/server";
import { getOfflineCatalog, harvestMeta } from "@/lib/registry";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = getOfflineCatalog();
  const meta = harvestMeta();
  return NextResponse.json({
    ok: true,
    service: "skillforge",
    version: "2.0.0",
    time: new Date().toISOString(),
    catalog: catalog.length,
    harvested: { total: meta.total, counts: meta.counts, generatedAt: meta.generatedAt },
    feeds: ["github", "npm", "mcp", "hn"],
    mcp: "/api/mcp",
  });
}

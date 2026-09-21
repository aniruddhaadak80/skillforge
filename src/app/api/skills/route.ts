import { NextResponse } from "next/server";
import { searchSkills } from "@/lib/engine";
import { getFullCatalog, getSealedCatalog } from "@/lib/registry";
import type { AgentPlatform, SkillCategory } from "@/lib/types";

export const revalidate = 3600;

const VALID_SORTS = ["score", "safety", "adopters", "name"] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = (url.searchParams.get("category") ?? "all") as SkillCategory | "all";
  const platform = (url.searchParams.get("platform") ?? "all") as AgentPlatform | "all";
  const sortRaw = url.searchParams.get("sort") ?? "score";
  const sort = (VALID_SORTS as readonly string[]).includes(sortRaw)
    ? (sortRaw as (typeof VALID_SORTS)[number])
    : "score";
  const minSafety = Math.max(0, Math.min(100, Number(url.searchParams.get("minSafety") ?? 0) || 0));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get("limit") ?? 50) || 50));

  const all = await getFullCatalog();
  const { scored, head } = await getSealedCatalog(all);
  const byId = new Map(scored.map((s) => [s.id, s]));
  const filtered = searchSkills(all, {
    query: url.searchParams.get("q") ?? "",
    category,
    platform,
    minSafety,
    sort,
  })
    .map((s) => byId.get(s.id))
    .filter((s) => s !== undefined)
    .slice(0, limit);

  const live = all.filter((s) => s.source !== "curated").length;
  return NextResponse.json({
    skills: filtered,
    total: filtered.length,
    catalog: all.length,
    live,
    head,
    algo: "SHA-384(prevSeal || canonicalJson)",
  });
}

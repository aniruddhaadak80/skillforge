import { NextResponse } from "next/server";
import { searchSkills } from "@/lib/engine";
import { getSealedCatalog, harvestMeta } from "@/lib/registry";
import type { AgentPlatform, SkillCategory, SkillSource } from "@/lib/types";

export const revalidate = 3600;

const VALID_SORTS = ["score", "safety", "adopters", "name"] as const;
const VALID_SOURCES = ["all", "curated", "github", "npm", "mcp", "hn"] as const;

export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = (url.searchParams.get("category") ?? "all") as SkillCategory | "all";
  const platform = (url.searchParams.get("platform") ?? "all") as AgentPlatform | "all";
  const sourceRaw = url.searchParams.get("source") ?? "all";
  const source = (VALID_SOURCES as readonly string[]).includes(sourceRaw)
    ? (sourceRaw as SkillSource | "all")
    : "all";
  const sortRaw = url.searchParams.get("sort") ?? "score";
  const sort = (VALID_SORTS as readonly string[]).includes(sortRaw)
    ? (sortRaw as (typeof VALID_SORTS)[number])
    : "score";
  const minSafety = Math.max(0, Math.min(100, Number(url.searchParams.get("minSafety") ?? 0) || 0));
  const minStars = Math.max(0, Number(url.searchParams.get("minStars") ?? 0) || 0);
  const openLicense = ["1", "true", "yes"].includes(
    (url.searchParams.get("openLicense") ?? "").toLowerCase(),
  );
  const limitRaw = url.searchParams.get("limit");
  const perPage = Math.max(
    1,
    Math.min(
      100,
      Number(limitRaw ?? url.searchParams.get("perPage") ?? 24) || 24,
    ),
  );
  const page = Math.max(1, Number(url.searchParams.get("page") ?? 1) || 1);

  const sealed = await getSealedCatalog();
  const base = sealed.scored.map(
    ({ seal: _a, sealedAt: _b, factors: _c, score: _d, safety: _e, grade: _f, ...rest }) => {
      void _a; void _b; void _c; void _d; void _e; void _f;
      return rest;
    },
  );
  const filtered = searchSkills(
    base,
    {
      query: url.searchParams.get("q") ?? "",
      category,
      platform,
      minSafety,
      sort,
      source,
      openLicense,
      minStars,
    },
    sealed.scores,
  );
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pages);
  const pageItems = filtered
    .slice((safePage - 1) * perPage, safePage * perPage)
    .map((s) => sealed.byId.get(s.id))
    .filter((s) => s !== undefined);

  // facets over the query-filtered (pre-facet) set: facet by category/source later —
  // here facets describe the whole catalog for stable UI chips
  const byCategory: Record<string, number> = {};
  const bySource: Record<string, number> = {};
  for (const s of sealed.scored) {
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1;
    bySource[s.source] = (bySource[s.source] ?? 0) + 1;
  }

  const meta = harvestMeta();
  return NextResponse.json({
    skills: pageItems,
    total,
    page: safePage,
    pages,
    perPage,
    catalog: sealed.scored.length,
    live: sealed.scored.filter((s) => s.source !== "curated").length,
    head: sealed.head,
    facets: { byCategory, bySource },
    generatedAt: meta.generatedAt,
    algo: "SHA-384(prevSeal || canonicalJson)",
  });
}

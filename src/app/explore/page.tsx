import { Suspense } from "react";
import type { Metadata } from "next";
import SearchExplorer from "@/components/SearchExplorer";
import SectionHeading from "@/components/SectionHeading";
import { searchSkills } from "@/lib/engine";
import { getSealedCatalog } from "@/lib/registry";

export const metadata: Metadata = { title: "Explore skills" };
export const revalidate = 3600;

export default async function ExplorePage() {
  const sealed = await getSealedCatalog();
  const base = sealed.scored.map(
    ({ seal: _a, sealedAt: _b, factors: _c, score: _d, safety: _e, grade: _f, ...rest }) => {
      void _a; void _b; void _c; void _d; void _e; void _f;
      return rest;
    },
  );
  const ranked = searchSkills(
    base,
    { query: "", category: "all", platform: "all", minSafety: 0, sort: "score", source: "all", openLicense: false, minStars: 0 },
    sealed.scores,
  );
  const perPage = 24;
  const initial = {
    skills: ranked.slice(0, perPage).map((s) => sealed.byId.get(s.id)).filter((s) => s !== undefined),
    total: ranked.length,
    pages: Math.max(1, Math.ceil(ranked.length / perPage)),
    facets: {
      byCategory: Object.fromEntries(
        ["research", "code", "data", "docs", "media", "ops"].map((c) => [
          c,
          sealed.scored.filter((s) => s.category === c).length,
        ]),
      ),
      bySource: Object.fromEntries(
        ["curated", "github", "npm", "mcp", "hn"].map((s) => [
          s,
          sealed.scored.filter((x) => x.source === s).length,
        ]),
      ),
    },
  };
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionHeading
        index="SEARCH"
        kicker="ADVANCED SEARCH"
        title="Find the exact skill your agent needs"
        blurb="Full-text relevance with exclusions, category chips with live counts, source, platform, safety and stars floors, license gate, and four rankings — across the whole 10,000-record catalog."
      />
      <div className="mt-8">
        <Suspense fallback={<p className="font-mono text-sm text-mist">Loading explorer…</p>}>
          <SearchExplorer initial={initial} />
        </Suspense>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import type { Metadata } from "next";
import SearchExplorer from "@/components/SearchExplorer";
import SectionHeading from "@/components/SectionHeading";
import { getCatalog, getSealedCatalog } from "@/lib/registry";

export const metadata: Metadata = { title: "Explore skills" };
export const revalidate = 3600;

export default async function ExplorePage() {
  const { scored } = await getSealedCatalog(getCatalog());
  const initial = [...scored].sort((a, b) => b.score - a.score);
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionHeading
        index="SEARCH"
        kicker="ADVANCED SEARCH"
        title="Find the exact skill your agent needs"
        blurb="Full-text relevance across names, capabilities and categories — plus category, platform, safety-floor and ranking filters. Results are scored and sealed live."
      />
      <div className="mt-8">
        <Suspense fallback={<p className="font-mono text-sm text-mist">Loading explorer…</p>}>
          <SearchExplorer initial={initial} />
        </Suspense>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import BundleComposer from "@/components/BundleComposer";
import SectionHeading from "@/components/SectionHeading";
import { getSealedCatalog } from "@/lib/registry";

export const metadata: Metadata = { title: "Compose a bundle" };
export const revalidate = 3600;

export default async function ComposePage() {
  const sealed = await getSealedCatalog();
  // Composer renders toggle buttons — top 80 by SkillScore keeps it instant.
  const ordered = [...sealed.scored].sort((a, b) => b.score - a.score).slice(0, 80);
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionHeading
        index="STUDIO"
        kicker="BUNDLE COMPOSER"
        title="Forge a skill stack for your agent"
        blurb="Pick skills, get compatibility checks, a combined score, a zero-dependency install script and an MCP bundle your agent can fetch itself."
        color="#f97316"
      />
      <div className="mt-8">
        <BundleComposer skills={ordered} />
      </div>
    </div>
  );
}

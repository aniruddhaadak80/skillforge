import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import InstallTabs from "@/components/InstallTabs";
import ScoreBars from "@/components/ScoreBars";
import { CATEGORIES, PLATFORMS } from "@/lib/types";
import { getCatalog, getFullCatalog, getSealedCatalog } from "@/lib/registry";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return getCatalog().map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const found = getCatalog().find((s) => s.id === id);
  return {
    title: found ? `${found.name} skill` : "Skill",
    description: found?.tagline,
  };
}

export default async function SkillPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const all = await getFullCatalog();
  const base = all.find((s) => s.id === id);
  if (!base) notFound();
  const { scored, head } = await getSealedCatalog(all);
  const skill = scored.find((s) => s.id === id);
  if (!skill) notFound();

  const color = CATEGORIES.find((c) => c.id === skill.category)?.color ?? "#94a3b8";
  const platformLabel = (p: string) => PLATFORMS.find((x) => x.id === p)?.label ?? p;
  const related = scored
    .filter((s) => s.id !== id && s.category === skill.category)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <Link href="/explore" className="flex items-center gap-1.5 text-sm text-mist hover:text-neon">
        <ArrowLeft className="size-4" /> All skills
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {skill.category}
            </span>
            <span className="rounded-full bg-gold/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-gold">
              Grade {skill.grade} · {skill.score}/100
            </span>
            <span className="flex items-center gap-1 rounded-full bg-mint/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-mint">
              <ShieldCheck className="size-3.5" /> Safety {skill.safety}
            </span>
            {skill.source !== "curated" && (
              <span className="rounded-full bg-neon/15 px-2.5 py-1 font-mono text-[11px] font-semibold text-neon">
                LIVE · {skill.source}
              </span>
            )}
          </div>
          <h1 className="font-display mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {skill.name}
          </h1>
          <p className="mt-2 text-lg text-neon/90">{skill.tagline}</p>
          <p className="mt-4 leading-relaxed text-mist">{skill.description}</p>

          <div className="mt-6 flex flex-wrap gap-1.5">
            {skill.capabilities.map((c) => (
              <span key={c} className="rounded-md border border-line bg-white/[0.03] px-2.5 py-1 font-mono text-xs text-mist">
                {c}
              </span>
            ))}
          </div>
          <p className="mt-4 font-mono text-xs text-mist">
            Works with: {skill.worksWith.map(platformLabel).join(" · ")} · v{skill.version} ·{" "}
            {skill.license} · by {skill.author}
          </p>

          <h2 className="font-display mt-10 text-2xl font-bold">SKILL.md preview</h2>
          <pre className="prose-skill mt-4 overflow-x-auto rounded-2xl border border-line bg-void p-5 font-mono text-xs leading-relaxed text-snow/90">
            {skill.skillMd}
          </pre>

          <h2 className="font-display mt-10 text-2xl font-bold">Install in one command</h2>
          <div className="mt-4">
            <InstallTabs skill={skill} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold">Why this score</h2>
            <div className="mt-4">
              <ScoreBars factors={skill.factors} />
            </div>
          </div>
          <div className="glass rounded-2xl p-5">
            <h2 className="font-display text-lg font-bold">Audit seal</h2>
            <p className="mt-2 font-mono text-[11px] leading-relaxed text-mist">
              SHA-384(prev ‖ canonicalJson)
            </p>
            <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-gold">
              {skill.seal}
            </p>
            <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-mist">
              chain head {head.slice(0, 32)}…
            </p>
            <p className="mt-3 font-mono text-[11px] leading-relaxed text-mist">
              Replay: POST {"{ids}"} to /api/seals/verify
            </p>
          </div>
          {related.length > 0 && (
            <div className="glass rounded-2xl p-5">
              <h2 className="font-display text-lg font-bold">Pairs well with</h2>
              <div className="mt-3 space-y-2">
                {related.map((r) => (
                  <Link
                    key={r.id}
                    href={`/skill/${r.id}`}
                    className="block rounded-xl border border-line bg-void p-3 transition-colors hover:border-neon/40"
                  >
                    <span className="text-sm font-semibold">{r.name}</span>
                    <span className="ml-2 font-mono text-[11px] text-mist">{r.score}/100</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

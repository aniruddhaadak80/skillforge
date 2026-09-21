import Link from "next/link";
import { ArrowRight, Atom, Boxes, Fingerprint, Radio, ShieldCheck } from "lucide-react";
import CategoryBento from "@/components/CategoryBento";
import Faq from "@/components/Faq";
import Hero from "@/components/Hero";
import LiveStrip from "@/components/LiveStrip";
import McpConsole from "@/components/McpConsole";
import PublishSteps from "@/components/PublishSteps";
import Reveal from "@/components/Reveal";
import SectionHeading from "@/components/SectionHeading";
import SkillCard from "@/components/SkillCard";
import SkillGraph from "@/components/SkillGraph";
import Ticker from "@/components/Ticker";
import { CATEGORIES } from "@/lib/types";
import { getSealedCatalog } from "@/lib/registry";

export const revalidate = 3600;

const NARRATIVE = [
  {
    icon: Radio,
    color: "#22d3ee",
    title: "Live signals, sealed fallback",
    body: "GitHub, npm, MCP servers and Hacker News refresh the catalog. If any feed fails, the 10,000-record sealed offline catalog keeps every page, demo and first paint alive.",
  },
  {
    icon: Atom,
    color: "#f97316",
    title: "One engine, three consumers",
    body: "SkillScore is deterministic and keyless: docs, breadth, compatibility, license, community, safety. The same function powers the UI, the REST API and the MCP tools.",
  },
  {
    icon: Boxes,
    color: "#34d399",
    title: "Your agent can shop here",
    body: "Five MCP tools — search, get, score, compose, verify — over JSON-RPC. Paste the mcp.json block and any capable agent can install skills by itself.",
  },
  {
    icon: Fingerprint,
    color: "#fbbf24",
    title: "Integrity you can replay",
    body: "Every record carries a SHA-384 hash chained to its predecessor. POST the ids to /api/seals/verify and watch 10,000 hashes recompute in under a second.",
  },
];

export default async function Home() {
  const sealed = await getSealedCatalog();
  const scored = sealed.scored;
  const byScore = [...scored].sort((a, b) => b.score - a.score);
  const featured = byScore.slice(0, 6);
  const avgScore = Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length);
  const avgSafety = Math.round(scored.reduce((s, x) => s + x.safety, 0) / scored.length);
  const sources = new Set(scored.map((s) => s.source)).size;
  const counts: Record<string, number> = {};
  for (const s of scored) counts[s.category] = (counts[s.category] ?? 0) + 1;
  const ticker = byScore.slice(0, 12).map((s) => `${s.name} · score ${s.score} · safety ${s.safety}`);
  const bento = CATEGORIES.map((c) => {
    const inCat = scored.filter((s) => s.category === c.id).sort((a, b) => b.score - a.score);
    const top = inCat[0];
    return {
      id: c.id,
      label: c.label,
      color: c.color,
      count: inCat.length,
      top: { id: top.id, name: top.name, score: top.score },
    };
  });

  return (
    <div>
      <Hero skills={scored.length} sources={sources} avgScore={avgScore} avgSafety={avgSafety} />

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SkillGraph counts={counts} />
        </Reveal>
      </div>

      <div className="mt-12">
        <Ticker items={ticker} />
      </div>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              index="01"
              kicker="TOP SCORED"
              title="This week in the forge"
              blurb="Highest SkillScore records across all 10,000+ indexed skills. Every card opens a full breakdown: factors, seal, SKILL.md and one-command install."
            />
            <Link href="/explore" className="flex items-center gap-1.5 text-sm text-neon hover:underline">
              Advanced search <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s, i) => (
            <Reveal key={s.id} delay={Math.min(i * 0.06, 0.3)}>
              <SkillCard skill={s} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <Reveal>
          <SectionHeading
            index="02"
            kicker="BROWSE BY CRAFT"
            title="Six crafts, ten thousand skills"
            blurb="Every record is classified into a craft at harvest time. Pick a lane — each card shows its reigning champion by SkillScore."
            color="#a3e635"
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <CategoryBento items={bento} />
        </Reveal>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <Reveal>
          <SectionHeading
            index="03"
            kicker="ENGINE"
            title="Advanced under the hood, calm on the surface"
            color="#f97316"
          />
        </Reveal>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {NARRATIVE.map((n, i) => (
            <Reveal key={n.title} delay={Math.min(i * 0.07, 0.25)}>
              <div className="glass h-full rounded-2xl p-6">
                <n.icon className="size-6" style={{ color: n.color }} />
                <h3 className="font-display mt-4 text-xl font-bold">{n.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{n.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Live */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              index="04"
              kicker="FRESH FROM THE FEED"
              title="Trending on GitHub right now"
              blurb="Ranked by real stars, refreshed hourly, sealed on arrival. Side-scroll through what agent builders are starring this week."
              color="#22d3ee"
            />
            <Link href="/explore" className="flex items-center gap-1.5 text-sm text-neon hover:underline">
              Browse all sources <ArrowRight className="size-4" />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <LiveStrip />
        </Reveal>
      </section>

      {/* MCP */}
      <section id="mcp" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <Reveal>
          <SectionHeading
            index="05"
            kicker="AGENT INTERFACE"
            title="Do not take our word for it — ask your agent"
            blurb="The console below hits the production MCP endpoint live. One click runs tools/list, search, scoring and seal verification."
            color="#34d399"
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <McpConsole />
        </Reveal>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <Reveal>
          <div className="glass relative overflow-hidden rounded-3xl border-mint/20 p-8 sm:p-12">
            <div
              className="pointer-events-none absolute -left-20 -top-20 size-72 rounded-full blur-3xl"
              style={{ backgroundColor: "#e11d48", opacity: 0.14 }}
            />
            <div
              className="pointer-events-none absolute -bottom-20 -right-20 size-72 rounded-full blur-3xl"
              style={{ backgroundColor: "#34d399", opacity: 0.14 }}
            />
            <div className="relative">
              <div className="flex flex-wrap items-center gap-3">
                <ShieldCheck className="size-8 text-mint" />
                <p className="font-mono text-xs tracking-[0.25em] text-mint">06 — SAFETY</p>
              </div>
              <h2 className="font-display mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
                Skills are code that acts. Score the risk before you grant it.
              </h2>
              <p className="mt-4 max-w-2xl leading-relaxed text-mist">
                From prompt tricks to recursive self-improvement, the road to superintelligence runs
                through agents executing skills. SkillForge maps every skill to a machine-readable risk
                surface, a 0–100 safety score, and guardrails your agent must obey.
              </p>
              <Link
                href="/safety"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-mint to-neon px-6 py-3 font-semibold text-void transition-transform hover:scale-[1.03]"
              >
                Read the alignment briefing <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Publish */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <Reveal>
          <SectionHeading
            index="07"
            kicker="CONTRIBUTE"
            title="Forge the 10,001st skill"
            blurb="The catalog grows the way good infrastructure should: one reviewed, risk-declared, sealed record at a time."
            color="#fbbf24"
          />
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <PublishSteps />
        </Reveal>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <SectionHeading
              index="08"
              kicker="QUESTIONS"
              title="Asked by humans and agents alike"
              color="#e11d48"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1} className="mt-8">
          <Faq />
        </Reveal>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <Reveal>
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Stop rewriting prompts.
            <br />
            <span className="text-aurora">Start forging skills.</span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/compose"
              className="rounded-xl bg-gradient-to-r from-ember to-crimson px-6 py-3.5 font-semibold text-void shadow-[0_0_36px_rgb(225_29_72/0.3)] transition-transform hover:scale-[1.03]"
            >
              Compose a bundle
            </Link>
            <Link
              href="/docs"
              className="rounded-xl border border-line bg-white/[0.03] px-6 py-3.5 font-semibold text-snow transition-colors hover:border-neon/50"
            >
              Read the docs
            </Link>
          </div>
        </Reveal>
      </section>
    </div>
  );
}

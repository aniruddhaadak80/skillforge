import Link from "next/link";
import { ArrowRight, Atom, Boxes, Fingerprint, Radio, ShieldCheck } from "lucide-react";
import Hero from "@/components/Hero";
import McpConsole from "@/components/McpConsole";
import SectionHeading from "@/components/SectionHeading";
import SkillCard from "@/components/SkillCard";
import SkillGraph from "@/components/SkillGraph";
import Ticker from "@/components/Ticker";
import { getCatalog, getSealedCatalog } from "@/lib/registry";

export const revalidate = 3600;

const NARRATIVE = [
  {
    icon: Radio,
    color: "#22d3ee",
    title: "Live signals, sealed fallback",
    body: "GitHub and Hacker News feeds refresh the catalog hourly. If any feed fails, the sealed offline catalog keeps every page, demo and first paint alive.",
  },
  {
    icon: Atom,
    color: "#a78bfa",
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
    body: "Every record carries a SHA-384 hash chained to its predecessor. POST the ids to /api/seals/verify and watch the chain recompute to the same head.",
  },
];

export default async function Home() {
  const catalog = getCatalog();
  const { scored } = await getSealedCatalog(catalog);
  const byScore = [...scored].sort((a, b) => b.score - a.score);
  const featured = byScore.slice(0, 6);
  const avgScore = Math.round(scored.reduce((s, x) => s + x.score, 0) / scored.length);
  const avgSafety = Math.round(scored.reduce((s, x) => s + x.safety, 0) / scored.length);
  const counts: Record<string, number> = {};
  for (const s of scored) counts[s.category] = (counts[s.category] ?? 0) + 1;
  const ticker = byScore.slice(0, 12).map((s) => `${s.name} · score ${s.score} · safety ${s.safety}`);

  return (
    <div>
      <Hero skills={scored.length} avgScore={avgScore} avgSafety={avgSafety} />

      <div className="mx-auto mt-12 max-w-6xl px-4 sm:px-6">
        <SkillGraph counts={counts} />
      </div>

      <div className="mt-12">
        <Ticker items={ticker} />
      </div>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pt-20 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <SectionHeading
            index="01"
            kicker="TOP SCORED"
            title="This week in the forge"
            blurb="Highest SkillScore records in the sealed catalog. Every card opens a full breakdown: factors, seal, SKILL.md and one-command install."
          />
          <Link href="/explore" className="flex items-center gap-1.5 text-sm text-neon hover:underline">
            Advanced search <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      </section>

      {/* Narrative */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <SectionHeading
          index="02"
          kicker="ENGINE"
          title="Advanced under the hood, calm on the surface"
          color="#a78bfa"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {NARRATIVE.map((n) => (
            <div key={n.title} className="glass rounded-2xl p-6">
              <n.icon className="size-6" style={{ color: n.color }} />
              <h3 className="font-display mt-4 text-xl font-bold">{n.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mist">{n.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MCP */}
      <section id="mcp" className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <SectionHeading
          index="03"
          kicker="AGENT INTERFACE"
          title="Do not take our word for it — ask your agent"
          blurb="The console below hits the production MCP endpoint live. One click runs tools/list, search, scoring and seal verification."
          color="#34d399"
        />
        <div className="mt-8">
          <McpConsole />
        </div>
      </section>

      {/* Safety */}
      <section className="mx-auto max-w-6xl px-4 pt-24 sm:px-6">
        <div className="glass overflow-hidden rounded-3xl border-mint/20 p-8 sm:p-12">
          <div className="flex flex-wrap items-center gap-3">
            <ShieldCheck className="size-8 text-mint" />
            <p className="font-mono text-xs tracking-[0.25em] text-mint">04 — SAFETY</p>
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
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Stop rewriting prompts.
          <br />
          <span className="text-aurora">Start forging skills.</span>
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/compose"
            className="rounded-xl bg-gradient-to-r from-neon to-grape px-6 py-3.5 font-semibold text-void transition-transform hover:scale-[1.03]"
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
      </section>
    </div>
  );
}

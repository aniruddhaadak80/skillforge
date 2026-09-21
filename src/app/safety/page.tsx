import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, ShieldAlert, ShieldCheck, TriangleAlert } from "lucide-react";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = { title: "Safety and alignment" };

const LADDER = [
  {
    name: "Narrow tools",
    color: "#22d3ee",
    body: "One task, no memory, no initiative. A regex explainer cannot go rogue — the blast radius is the output box.",
  },
  {
    name: "Agentic AI — today",
    color: "#a78bfa",
    body: "Agents with tools, memory and goals: OpenClaw, Claude Code, Cursor. Useful and already capable of real damage with a bad skill — leaked secrets, wiped folders, spam sent in your name.",
  },
  {
    name: "AGI",
    color: "#fbbf24",
    body: "Human-level generality. A skill ecosystem that cannot score risk today will not survive contact with AGI-level initiative tomorrow.",
  },
  {
    name: "Recursive self-improvement → ASI",
    color: "#fb7185",
    body: "An agent that rewrites its own skills compounds every flaw. Alignment is not a feature to add later — it is the registry layer, the score, the seal, the guardrail.",
  },
];

const CHECKS = [
  "Read the SKILL.md guardrails before installing — a skill with no guardrails section scores lower here for a reason.",
  "Check the safety score, not just the SkillScore. Anything under 60 executes code, touches secrets, or calls external APIs.",
  "Install with least privilege: read-only skills first, write-capable skills in a sandbox, exec-capable skills never autonomously.",
  "Pin versions. A skill that auto-updates is a supply chain with your name on it.",
  "Verify the seal after install: replay /api/seals/verify and confirm the chain head matches.",
  "Never paste secrets into a skill. If a workflow needs a token, it reads env — full stop.",
];

export default function SafetyPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <SectionHeading
        index="BRIEFING"
        kicker="ALIGNMENT"
        title="From helpful agent to superintelligence: why skills are the leverage point"
        blurb="Capabilities compound. A skill is reusable agency — write it once, and every agent that installs it inherits its judgment, including its flaws. That makes the skill registry an alignment surface."
        color="#34d399"
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {LADDER.map((l, i) => (
          <div key={l.name} className="glass rounded-2xl p-6">
            <p className="font-mono text-xs" style={{ color: l.color }}>
              LEVEL {i + 1}
            </p>
            <h2 className="font-display mt-2 text-xl font-bold">{l.name}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mist">{l.body}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-gold" />
            <h2 className="font-display text-xl font-bold">The alignment problem, in one paragraph</h2>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            An agent optimizes what you asked for, not what you wanted. Underspecified goals plus
            powerful tools equals surprising side effects — deleting the data to fix the report,
            spamming contacts to clear the inbox. Skills make this worse by scaling one
            imperfect judgment across thousands of agents, and better by encoding guardrails once
            and enforcing them everywhere. SkillForge exists to make the second outcome the default:
            every skill declares its risk surface, earns a safety score, and ships guardrails the
            engine can check.
          </p>
        </div>
        <div className="glass rounded-2xl border-mint/20 p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-5 text-mint" />
            <h2 className="font-display text-xl font-bold">How SkillForge answers it</h2>
          </div>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-mist">
            <li><span className="text-snow">Risk flags are data, not vibes.</span> exec-code, writes-files, network-egress, external-api, reads-secrets — machine-readable, score-driving.</li>
            <li><span className="text-snow">Safety is scored separately from quality.</span> A brilliant but dangerous skill can be Grade A with Safety 40. Both numbers travel with the record.</li>
            <li><span className="text-snow">Seals make tampering visible.</span> A modified skill breaks its chain position; verification recomputes every hash.</li>
            <li><span className="text-snow">Bundles check conflicts.</span> Two skills covering the same capability in one stack get flagged before install.</li>
          </ul>
        </div>
      </div>

      <div className="glass mt-6 rounded-2xl border-coral/25 p-6 sm:p-8">
        <div className="flex items-center gap-2">
          <ShieldAlert className="size-5 text-coral" />
          <h2 className="font-display text-xl font-bold">Install checklist — use it every time</h2>
        </div>
        <ol className="mt-4 space-y-2.5">
          {CHECKS.map((c, i) => (
            <li key={c} className="flex gap-3 text-sm leading-relaxed text-mist">
              <span className="font-mono text-coral">{String(i + 1).padStart(2, "0")}</span> {c}
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/explore"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-mint to-neon px-6 py-3.5 font-semibold text-void transition-transform hover:scale-[1.03]"
        >
          Browse safety-scored skills <ArrowRight className="size-4" />
        </Link>
      </div>
    </div>
  );
}

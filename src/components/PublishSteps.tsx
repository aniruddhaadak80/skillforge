import Link from "next/link";
import { ArrowRight } from "lucide-react";

const STEPS = [
  {
    n: "01",
    color: "#a3e635",
    title: "Fork and add your skill",
    body: "One record in src/lib/fallback.ts: id, triggers, workflow, guardrails, honest risk flags.",
  },
  {
    n: "02",
    color: "#fbbf24",
    title: "Declare risk honestly",
    body: "exec-code, writes-files, network-egress, external-api, reads-secrets — the engine scores what you declare.",
  },
  {
    n: "03",
    color: "#f97316",
    title: "Pass lint and build",
    body: "npm run lint plus npm run build, both green. No keys, no paywalled deps, ever.",
  },
  {
    n: "04",
    color: "#e11d48",
    title: "Open the PR",
    body: "Maintainers check scoring honesty and guardrail quality. Merged skills ship sealed to 10,000+ neighbors.",
  },
];

export default function PublishSteps() {
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s) => (
          <div key={s.n} className="glass rounded-2xl p-6">
            <p className="font-mono text-sm font-bold" style={{ color: s.color }}>
              {s.n}
            </p>
            <h3 className="font-display mt-2 text-lg font-bold">{s.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-mist">{s.body}</p>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/docs"
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-lime to-ember px-6 py-3 font-semibold text-void transition-transform hover:scale-[1.03]"
        >
          Authoring guide <ArrowRight className="size-4" />
        </Link>
        <a
          href="https://github.com/aniruddhaadak80/skillforge/blob/main/CONTRIBUTING.md"
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-line bg-white/[0.03] px-6 py-3 font-semibold text-snow transition-colors hover:border-lime/50"
        >
          Contributing checklist
        </a>
      </div>
    </div>
  );
}

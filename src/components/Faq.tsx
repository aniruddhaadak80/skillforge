const FAQS = [
  {
    q: "Does it cost anything? Do I need API keys?",
    a: "No and no. The catalog, scoring, MCP tools, and installs are free forever with zero keys. Live feeds use keyless public APIs; everything degrades to the sealed offline catalog when a feed fails.",
  },
  {
    q: "Where do 10,000+ skills come from?",
    a: "A harvester indexes real public sources — GitHub agent/skill/MCP repos, npm agent packages, official MCP servers, and exact SKILL.md bodies — then seals every record into a SHA-384 chain. Re-harvests refresh the catalog; the harvest script ships in scripts/harvest.mjs.",
  },
  {
    q: "How does SkillScore work?",
    a: "Six deterministic factors: documentation completeness, capability breadth, multi-agent compatibility, license openness, community signal, and safety posture — plus a separate 0–100 safety score from declared risk flags. Same function serves the UI, REST, and MCP.",
  },
  {
    q: "How does my agent use it?",
    a: "Add public/mcp.json to your agent config and it gets five tools: search_skills, get_skill, score_skill, compose_bundle, verify_seal. Humans get the same power over REST plus one-command curl installs.",
  },
  {
    q: "Can I trust a high score?",
    a: "Scores are heuristics, not guarantees. Always read the SKILL.md, check the safety number, verify the seal, install least-privilege first, and never paste secrets into a skill. The safety briefing explains the full model.",
  },
  {
    q: "How do I publish my skill?",
    a: "Fork the repo, add one record to src/lib/fallback.ts with honest risk flags, keep lint and build green, open a PR. The authoring guide in Docs walks through it in five moves.",
  },
];

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {FAQS.map((f) => (
        <details
          key={f.q}
          className="glass group rounded-2xl px-6 py-4 transition-colors open:border-ember/40"
        >
          <summary className="cursor-pointer list-none font-display text-base font-bold text-snow marker:hidden [&::-webkit-details-marker]:hidden">
            <span className="mr-2 text-ember transition-transform group-open:inline-block">
              +
            </span>
            {f.q}
          </summary>
          <p className="mt-3 text-sm leading-relaxed text-mist">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

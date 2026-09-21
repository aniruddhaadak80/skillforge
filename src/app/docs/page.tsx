import type { Metadata } from "next";
import McpConsole from "@/components/McpConsole";
import SectionHeading from "@/components/SectionHeading";

export const metadata: Metadata = { title: "Documentation" };

function Code({ text }: { text: string }) {
  return (
    <pre className="mt-3 overflow-x-auto rounded-xl border border-line bg-void p-4 font-mono text-xs leading-relaxed text-neon">
      {text}
    </pre>
  );
}

const SKILL_TEMPLATE = `# My Skill

## Triggers
When the user asks for <thing> or the agent sees <signal>.

## Workflow
1. Clarify the exact outcome first.
2. Do the smallest safe step.
3. Show the result with evidence.

## Guardrails
- Never invent sources or IDs.
- Ask before destructive actions.
`;

const MCP_JSON = `{
  "mcpServers": {
    "skillforge": {
      "url": "https://skillforge-aniruddha-adaks-projects.vercel.app/api/mcp",
      "transport": "http-json-rpc"
    }
  }
}`;

const CURL_SEARCH = `curl -s "https://skillforge-aniruddha-adaks-projects.vercel.app/api/skills?q=pdf&sort=score&limit=3"`;

const CURL_MCP = `curl -s https://skillforge-aniruddha-adaks-projects.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"search_skills","arguments":{"query":"pdf","limit":3}}}'`;

const CURL_VERIFY = `curl -s https://skillforge-aniruddha-adaks-projects.vercel.app/api/seals/verify \\
  -H "Content-Type: application/json" \\
  -d '{"ids":["pr-reviewer","pdf-miner"]}'`;

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
      <SectionHeading
        index="MANUAL"
        kicker="DOCUMENTATION"
        title="From zero to skilled agent in ten minutes"
        blurb="What a skill is, how to install one on four platforms, how to author and publish your own, and how to drive everything as an agent over MCP or REST."
        color="#fbbf24"
      />

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Step 1 — Understand the unit: SKILL.md</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          A skill is a markdown file with three sections: triggers (when to fire), workflow
          (numbered steps the agent follows), and guardrails (lines it must not cross).
          No SDK, no build step, no vendor lock-in — any agent that reads markdown can run it.
          Every SkillForge record embeds this file and scores it for completeness.
        </p>
        <Code text={SKILL_TEMPLATE} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Step 2 — Install one anywhere in 60 seconds</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Open any skill page and pick your platform tab. The pattern is always the same:
          create a folder, curl the SKILL.md into it, point your agent at the folder.
          OpenClaw uses skills/, Claude Code uses .claude/skills/, Cursor uses .cursor/skills/,
          and any MCP agent can skip files entirely and call the registry over HTTP.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Step 3 — Author your own in 5 moves</h2>
        <ol className="mt-4 space-y-2.5 text-sm leading-relaxed text-mist">
          <li><span className="font-mono text-neon">01 </span> Name one job the skill does. One job, one skill.</li>
          <li><span className="font-mono text-neon">02 </span> Write triggers as observable signals, not vibes.</li>
          <li><span className="font-mono text-neon">03 </span> Write the workflow as numbered steps with a visible evidence rule.</li>
          <li><span className="font-mono text-neon">04 </span> Write guardrails first-class: secrets, destruction, autonomy limits.</li>
          <li><span className="font-mono text-neon">05 </span> Declare risk flags honestly and POST it to /api/score to see your grade.</li>
        </ol>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Step 4 — Publish it to the registry</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Fork the repo, add your skill to src/lib/fallback.ts following the existing shape,
          run npm run lint and npm run build, then open a PR. Curated skills ship with the
          offline catalog so they work even with zero network. See CONTRIBUTING.md for the checklist.
        </p>
      </section>

      <section id="agent" className="mt-12 scroll-mt-24">
        <h2 className="font-display text-2xl font-bold">Step 5 — Drive it as an agent (MCP)</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Add this block to mcp.json in OpenClaw, Claude Code, Cursor or any MCP-capable agent.
          Five tools appear: search_skills, get_skill, score_skill, compose_bundle, verify_seal.
        </p>
        <Code text={MCP_JSON} />
        <div className="mt-6">
          <McpConsole />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Step 6 — Use the REST API directly</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          No keys, cached hourly, offline-sealed. Health, catalog search with filters, single
          skill with seal, raw SKILL.md for install scripts, deterministic scoring, and
          chain verification.
        </p>
        <Code text={CURL_SEARCH} />
        <Code text={CURL_MCP} />
        <Code text={CURL_VERIFY} />
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold">Step 7 — Understand what you are building toward</h2>
        <p className="mt-3 text-sm leading-relaxed text-mist">
          Prompts become skills, skills become agents, agents become economies of agents — and
          the same ladder climbs toward AGI and superintelligence. The safety briefing explains
          why the registry layer is where alignment gets practical.
        </p>
      </section>
    </div>
  );
}

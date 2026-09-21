"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import type { AgentPlatform, Skill } from "@/lib/types";
import { PLATFORMS } from "@/lib/types";

function useOrigin(): string {
  // Lazy initializer reads the browser origin once — no effect needed.
  const [origin] = useState(() =>
    typeof window === "undefined" ? "https://skillforge-aniruddha-adaks-projects.vercel.app" : window.location.origin,
  );
  return origin;
}

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setDone(true);
          window.setTimeout(() => setDone(false), 1600);
        });
      }}
      className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-mono text-[11px] text-mist transition-colors hover:border-neon/50 hover:text-neon"
      aria-label="Copy to clipboard"
    >
      {done ? <Check className="size-3.5 text-mint" /> : <Copy className="size-3.5" />}
      {done ? "Copied" : "Copy"}
    </button>
  );
}

const STEPS: Record<AgentPlatform, (cmd: string, id: string) => string[]> = {
  openclaw: (cmd, id) => [
    `1. Create the skill folder:  mkdir -p skills/${id}`,
    `2. Install:  ${cmd}`,
    "3. Mention it in SOUL.md or BOOTSTRAP.md so OpenClaw loads it on boot.",
  ],
  "claude-code": (cmd, id) => [
    `1. Project scope:  mkdir -p .claude/skills/${id}`,
    `2. Install:  ${cmd.replace(`skills/${id}/SKILL.md`, `.claude/skills/${id}/SKILL.md`)}`,
    "3. Or user scope: ~/.claude/skills/ for every project.",
  ],
  cursor: (cmd, id) => [
    `1. Create:  mkdir -p .cursor/skills/${id}`,
    `2. Install:  ${cmd.replace(`skills/${id}/SKILL.md`, `.cursor/skills/${id}/SKILL.md`)}`,
    "3. Reference it from .cursor/rules so the agent picks it up.",
  ],
  "generic-mcp": (cmd) => [
    `1. Install the SKILL.md:  ${cmd}`,
    "2. Or call it remotely — add this to mcp.json:",
  ],
};

export default function InstallTabs({ skill }: { skill: Skill }) {
  const origin = useOrigin();
  const [tab, setTab] = useState<AgentPlatform>("openclaw");
  const cmd = `curl -fsSL "${origin}/api/skills/${skill.id}/skill.md" -o skills/${skill.id}/SKILL.md`;

  const mcpJson = JSON.stringify(
    {
      mcpServers: {
        skillforge: {
          url: "https://skillforge-aniruddha-adaks-projects.vercel.app/api/mcp",
          transport: "http-json-rpc",
        },
      },
    },
    null,
    2,
  );

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex flex-wrap gap-1 border-b border-line/70 p-2">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            onClick={() => setTab(p.id)}
            className={`rounded-lg px-3.5 py-2 text-sm transition-colors ${
              tab === p.id ? "bg-neon/15 text-neon" : "text-mist hover:bg-white/5 hover:text-snow"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <div className="space-y-2.5 p-5">
        {STEPS[tab](cmd, skill.id).map((s) => (
          <p key={s} className="font-mono text-xs leading-relaxed text-mist">
            {s}
          </p>
        ))}
        <div className="rounded-xl border border-line bg-void p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-widest text-mist">
              {tab === "generic-mcp" ? "mcp.json" : "Install command"}
            </span>
            <CopyBtn text={tab === "generic-mcp" ? mcpJson : cmd} />
          </div>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-neon">
            {tab === "generic-mcp" ? mcpJson : cmd}
          </pre>
        </div>
        {tab === "generic-mcp" && (
          <p className="font-mono text-[11px] leading-relaxed text-mist">
            Then call: POST /api/mcp {"{tools/call: get_skill, id: "}
            {skill.id}
            {"}"} — try it in the live console on the home page.
          </p>
        )}
      </div>
    </div>
  );
}

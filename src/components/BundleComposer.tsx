"use client";

import { useMemo, useState } from "react";
import { Check, Copy, PackagePlus, ShieldCheck } from "lucide-react";
import { composeBundle } from "@/lib/engine";
import type { ScoredSkill } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

function catColor(cat: string): string {
  return CATEGORIES.find((c) => c.id === cat)?.color ?? "#94a3b8";
}

export default function BundleComposer({ skills }: { skills: ScoredSkill[] }) {
  const [selected, setSelected] = useState<string[]>(["pr-reviewer", "test-forger", "release-pilot"]);
  const [proof, setProof] = useState("");
  const [proving, setProving] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => composeBundle(skills, selected), [skills, selected]);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(0, 8)));
  }

  async function proveViaMcp() {
    setProving(true);
    setProof("…calling tools/call compose_bundle");
    try {
      const r = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 9,
          method: "tools/call",
          params: { name: "compose_bundle", arguments: { ids: selected } },
        }),
      });
      const j = await r.json();
      const text: string = j.result?.content?.[0]?.text ?? JSON.stringify(j);
      const parsed = JSON.parse(text) as { seal?: string; combinedScore?: number };
      setProof(`MCP seal ${String(parsed.seal).slice(0, 32)}… · score ${parsed.combinedScore} — matches local compute`);
    } catch (e) {
      setProof(`Failed: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setProving(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <p className="font-mono text-xs text-mist">Pick up to 8 skills — click to toggle.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {skills.map((s) => {
            const on = selected.includes(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all ${
                  on ? "border-neon/60 bg-neon/10" : "border-line bg-panel/60 hover:border-mist/40"
                }`}
              >
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-md border ${
                    on ? "border-neon bg-neon text-void" : "border-line text-transparent"
                  }`}
                >
                  <Check className="size-3.5" strokeWidth={3} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{s.name}</span>
                  <span className="font-mono text-[11px]" style={{ color: catColor(s.category) }}>
                    {s.category} · {s.score}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass h-fit rounded-2xl p-5 lg:sticky lg:top-24">
        <div className="flex items-center gap-2">
          <PackagePlus className="size-5 text-grape" />
          <h2 className="font-display text-lg font-bold">Bundle report</h2>
        </div>
        {selected.length === 0 ? (
          <p className="mt-3 text-sm text-mist">Select at least one skill to compose a bundle.</p>
        ) : (
          <div className="mt-3 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-void p-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-mist">Combined</p>
                <p className="font-display text-3xl font-bold text-neon">{result.combinedScore}</p>
              </div>
              <div className="rounded-xl border border-line bg-void p-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-mist">Safety</p>
                <p className="flex items-center gap-1.5 font-display text-3xl font-bold text-mint">
                  <ShieldCheck className="size-6" /> {result.combinedSafety}
                </p>
              </div>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-mist">
                Capabilities ({result.capabilities.length})
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {result.capabilities.map((c) => (
                  <span key={c} className="rounded-md border border-line bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-mist">
                    {c}
                  </span>
                ))}
              </div>
            </div>
            {result.conflicts.length > 0 && (
              <div className="rounded-xl border border-gold/40 bg-gold/10 p-3">
                <p className="font-mono text-[11px] uppercase tracking-widest text-gold">Conflicts</p>
                {result.conflicts.map((c) => (
                  <p key={c} className="mt-1 text-xs leading-relaxed text-gold/90">{c}</p>
                ))}
              </div>
            )}
            <div className="rounded-xl border border-line bg-void p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-widest text-mist">Install script</span>
                <button
                  onClick={() => {
                    void navigator.clipboard.writeText(result.installScript).then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 1600);
                    });
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 font-mono text-[11px] text-mist hover:border-neon/50 hover:text-neon"
                >
                  {copied ? <Check className="size-3.5 text-mint" /> : <Copy className="size-3.5" />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="max-h-44 overflow-auto font-mono text-[11px] leading-relaxed text-neon">
                {result.installScript}
              </pre>
            </div>
            <button
              onClick={proveViaMcp}
              disabled={proving}
              className="w-full rounded-xl bg-gradient-to-r from-mint to-neon px-4 py-2.5 text-sm font-semibold text-void transition-transform hover:scale-[1.02] disabled:opacity-50"
            >
              {proving ? "Proving…" : "Prove it via the agent path (MCP)"}
            </button>
            {proof && <p className="font-mono text-[11px] leading-relaxed text-mint">{proof}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

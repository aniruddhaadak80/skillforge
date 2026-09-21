"use client";

import { useState } from "react";
import { Play, Terminal } from "lucide-react";

const PRESETS: { label: string; payload: Record<string, unknown> }[] = [
  {
    label: "tools/list",
    payload: { jsonrpc: "2.0", id: 1, method: "tools/list" },
  },
  {
    label: "search: pdf",
    payload: {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name: "search_skills", arguments: { query: "pdf", limit: 2 } },
    },
  },
  {
    label: "score: pr-reviewer",
    payload: {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: { name: "score_skill", arguments: { id: "pr-reviewer" } },
    },
  },
  {
    label: "verify seals",
    payload: {
      jsonrpc: "2.0",
      id: 4,
      method: "tools/call",
      params: { name: "verify_seal", arguments: { ids: ["pr-reviewer", "pdf-miner"] } },
    },
  },
];

export default function McpConsole() {
  const [req, setReq] = useState<string>("Press a preset to call the live MCP endpoint.");
  const [res, setRes] = useState<string>("Response appears here.");
  const [loading, setLoading] = useState(false);

  async function send(payload: Record<string, unknown>) {
    setLoading(true);
    setReq(JSON.stringify(payload, null, 2));
    setRes("…calling /api/mcp");
    try {
      const r = await fetch("/api/mcp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const text = await r.text();
      try {
        setRes(JSON.stringify(JSON.parse(text), null, 2).slice(0, 4000));
      } catch {
        setRes(text.slice(0, 4000));
      }
    } catch (e) {
      setRes(`Network error: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b border-line/70 px-5 py-3.5">
        <Terminal className="size-4 text-mint" />
        <span className="font-display text-sm font-semibold">Live MCP console</span>
        <span className="ml-auto font-mono text-[11px] text-mist">POST /api/mcp</span>
      </div>
      <div className="flex flex-wrap gap-2 px-5 pt-4">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            disabled={loading}
            onClick={() => send(p.payload)}
            className="flex items-center gap-1.5 rounded-lg border border-mint/30 bg-mint/10 px-3 py-1.5 font-mono text-xs text-mint transition-all hover:bg-mint/20 disabled:opacity-50"
          >
            <Play className="size-3" /> {p.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 p-5 md:grid-cols-2">
        <div>
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-mist">Request</p>
          <pre className="h-56 overflow-auto rounded-xl border border-line bg-void p-3 font-mono text-[11px] leading-relaxed text-neon">
            {req}
          </pre>
        </div>
        <div>
          <p className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-mist">Response</p>
          <pre className="h-56 overflow-auto rounded-xl border border-line bg-void p-3 font-mono text-[11px] leading-relaxed text-mint">
            {loading ? "…calling /api/mcp" : res}
          </pre>
        </div>
      </div>
    </div>
  );
}

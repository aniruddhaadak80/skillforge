"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Terminal } from "lucide-react";

interface Props {
  skills: number;
  avgScore: number;
  avgSafety: number;
}

export default function Hero({ skills, avgScore, avgSafety }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 pt-16 sm:px-6 sm:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 px-3.5 py-1.5 font-mono text-xs text-mint">
          <span className="size-1.5 animate-pulse-glow rounded-full bg-mint" />
          FREE FOREVER · NO KEYS · OFFLINE-FIRST
        </p>
        <h1 className="font-display mt-6 text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
          Reusable skills
          <br />
          for <span className="text-aurora text-glow-cyan">every agent</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
          SkillForge is the open registry for SKILL.md agent skills. Search, safety-score,
          compose and install battle-tested skills for OpenClaw, Claude Code, Cursor and any
          MCP agent — in seconds, not weekends.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-neon to-grape px-6 py-3.5 font-semibold text-void transition-transform hover:scale-[1.03]"
          >
            Explore {skills} skills <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/docs#agent"
            className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-6 py-3.5 font-semibold text-snow transition-colors hover:border-mint/50 hover:text-mint"
          >
            <Terminal className="size-4" /> Connect your agent
          </Link>
        </div>
        <div className="mt-10 flex flex-wrap gap-8">
          {[
            { v: String(skills), l: "curated skills" },
            { v: String(avgScore), l: "avg SkillScore" },
            { v: String(avgSafety), l: "avg safety" },
          ].map((s) => (
            <div key={s.l}>
              <p className="font-display text-3xl font-bold text-snow">{s.v}</p>
              <p className="mt-1 flex items-center gap-1.5 font-mono text-xs text-mist">
                {s.l === "avg safety" && <ShieldCheck className="size-3.5 text-mint" />}
                {s.l}
              </p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

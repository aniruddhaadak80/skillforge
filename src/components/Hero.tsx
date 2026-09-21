"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ShieldCheck, Terminal } from "lucide-react";
import CountUp from "./CountUp";

interface Props {
  skills: number;
  sources: number;
  avgScore: number;
  avgSafety: number;
}

const ORBS = [
  { bg: "#34d399", x: "-8%", y: "-12%", size: 480, o: 0.22, d: 11 },
  { bg: "#e11d48", x: "78%", y: "-6%", size: 420, o: 0.2, d: 13 },
  { bg: "#fbbf24", x: "8%", y: "62%", size: 380, o: 0.16, d: 9 },
  { bg: "#22d3ee", x: "72%", y: "58%", size: 440, o: 0.18, d: 12 },
  { bg: "#f97316", x: "42%", y: "18%", size: 520, o: 0.14, d: 14 },
];

const CHIPS = [
  { t: "pdf-miner · 92", c: "#34d399", x: "4%", y: "12%", dl: "0s" },
  { t: "pr-reviewer · 95", c: "#a3e635", x: "86%", y: "20%", dl: "1.2s" },
  { t: "web-scraper · 88", c: "#f97316", x: "2%", y: "66%", dl: "0.6s" },
  { t: "release-pilot · 90", c: "#fbbf24", x: "88%", y: "62%", dl: "1.8s" },
  { t: "deep-researcher · 93", c: "#22d3ee", x: "12%", y: "86%", dl: "2.4s" },
  { t: "sql-smith · 91", c: "#e11d48", x: "78%", y: "84%", dl: "0.9s" },
];

export default function Hero({ skills, sources, avgScore, avgSafety }: Props) {
  return (
    <div className="relative overflow-hidden">
      {/* aurora mesh */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {ORBS.map((o, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl"
            style={{ backgroundColor: o.bg, left: o.x, top: o.y, width: o.size, height: o.size, opacity: o.o }}
            animate={{ x: [0, 46, -30, 0], y: [0, -34, 26, 0] }}
            transition={{ duration: o.d, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>
      {/* floating skill chips */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        {CHIPS.map((c) => (
          <span
            key={c.t}
            className="glass absolute animate-float rounded-full px-3.5 py-1.5 font-mono text-[11px]"
            style={{ left: c.x, top: c.y, color: c.c, borderColor: `${c.c}44`, animationDelay: c.dl }}
          >
            {c.t}
          </span>
        ))}
      </div>

      <div className="relative mx-auto max-w-6xl px-4 pt-20 sm:px-6 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.p
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 rounded-full border border-lime/40 bg-lime/10 px-3.5 py-1.5 font-mono text-xs text-lime"
          >
            <span className="size-1.5 animate-pulse-glow rounded-full bg-lime" />
            10,000+ SKILLS · FREE FOREVER · NO KEYS · OFFLINE-FIRST
          </motion.p>
          <h1 className="font-display mt-6 text-5xl font-bold leading-[1.02] tracking-tight sm:text-7xl">
            Reusable skills
            <br />
            for <span className="text-aurora">every agent</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-mist">
            SkillForge is the open registry for SKILL.md agent skills — harvested from GitHub,
            npm and official MCP servers, safety-scored, hash-sealed. Search, compose and
            install for OpenClaw, Claude Code, Cursor and any MCP agent.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/explore"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-ember to-crimson px-6 py-3.5 font-semibold text-void shadow-[0_0_36px_rgb(225_29_72/0.35)] transition-transform hover:scale-[1.03]"
            >
              Explore {skills.toLocaleString()} skills <ArrowRight className="size-4" />
            </Link>
            <Link
              href="/docs#agent"
              className="flex items-center gap-2 rounded-xl border border-line bg-white/[0.03] px-6 py-3.5 font-semibold text-snow backdrop-blur transition-colors hover:border-mint/50 hover:text-mint"
            >
              <Terminal className="size-4" /> Connect your agent
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { v: skills, l: "indexed skills" },
              { v: sources, l: "live sources" },
              { v: avgScore, l: "avg SkillScore" },
              { v: avgSafety, l: "avg safety", icon: true },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl px-4 py-5">
                <p className="font-display text-3xl font-bold text-snow">
                  <CountUp value={s.v} />
                </p>
                <p className="mt-1 flex items-center justify-center gap-1.5 font-mono text-xs text-mist">
                  {s.icon && <ShieldCheck className="size-3.5 text-mint" />}
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import SkillCard from "./SkillCard";
import type { AgentPlatform, ScoredSkill, SkillCategory } from "@/lib/types";
import { CATEGORIES, PLATFORMS } from "@/lib/types";

interface Props {
  initial: ScoredSkill[];
}

export default function SearchExplorer({ initial }: Props) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<SkillCategory | "all">("all");
  const [platform, setPlatform] = useState<AgentPlatform | "all">("all");
  const [minSafety, setMinSafety] = useState(0);
  const [sort, setSort] = useState("score");
  const [results, setResults] = useState<ScoredSkill[]>(initial);
  const [total, setTotal] = useState(initial.length);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams({
        q,
        category,
        platform,
        minSafety: String(minSafety),
        sort,
        limit: "48",
      });
      setLoading(true);
      fetch(`/api/skills?${params.toString()}`)
        .then((r) => r.json())
        .then((j: { skills: ScoredSkill[]; total: number }) => {
          setResults(j.skills);
          setTotal(j.total);
          setOffline(false);
        })
        .catch(() => setOffline(true))
        .finally(() => setLoading(false));
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, category, platform, minSafety, sort]);

  const select =
    "rounded-lg border border-line bg-void px-3 py-2 text-sm text-snow outline-none focus:border-neon/60";

  return (
    <div>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-void px-4 py-3 focus-within:border-neon/60">
          <Search className="size-5 shrink-0 text-neon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Try pdf, code review, calendar, regex, release…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-mist/60"
            aria-label="Search skills"
          />
          {loading && <span className="font-mono text-[11px] text-neon">…</span>}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-mist">
            <SlidersHorizontal className="size-3.5" /> Filters
          </span>
          <select value={category} onChange={(e) => setCategory(e.target.value as SkillCategory | "all")} className={select} aria-label="Category">
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select value={platform} onChange={(e) => setPlatform(e.target.value as AgentPlatform | "all")} className={select} aria-label="Platform">
            <option value="all">All agents</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={select} aria-label="Sort">
            <option value="score">Top scored</option>
            <option value="safety">Safest first</option>
            <option value="adopters">Most adopted</option>
            <option value="name">A–Z</option>
          </select>
          <label className="flex items-center gap-2 font-mono text-xs text-mist">
            Safety ≥ {minSafety}
            <input
              type="range"
              min={0}
              max={90}
              step={10}
              value={minSafety}
              onChange={(e) => setMinSafety(Number(e.target.value))}
              className="w-28 accent-emerald-400"
              aria-label="Minimum safety score"
            />
          </label>
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-mist">
        {offline ? (
          <span className="text-gold">OFFLINE MODE — showing last known catalog.</span>
        ) : (
          <span>{total} skill{total === 1 ? "" : "s"} found · scored + sealed live</span>
        )}
      </p>

      {results.length === 0 ? (
        <div className="glass mt-4 rounded-2xl p-10 text-center">
          <p className="font-display text-xl font-bold">No skills match — yet.</p>
          <p className="mt-2 text-sm text-mist">
            Loosen a filter, or author this skill yourself — the docs show how in 5 steps.
          </p>
        </div>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((s) => (
            <SkillCard key={s.id} skill={s} />
          ))}
        </div>
      )}
    </div>
  );
}

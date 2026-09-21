"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal } from "lucide-react";
import SkillCard from "./SkillCard";
import type { AgentPlatform, ScoredSkill, SkillCategory, SkillSource } from "@/lib/types";
import { CATEGORIES, PLATFORMS, SOURCES } from "@/lib/types";

export interface ExplorerInitial {
  skills: ScoredSkill[];
  total: number;
  pages: number;
  facets: { byCategory: Record<string, number>; bySource: Record<string, number> };
}

const PER_PAGE = 24;

export default function SearchExplorer({ initial }: { initial: ExplorerInitial }) {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<SkillCategory | "all">("all");
  const [platform, setPlatform] = useState<AgentPlatform | "all">("all");
  const [source, setSource] = useState<SkillSource | "all">("all");
  const [minSafety, setMinSafety] = useState(0);
  const [minStars, setMinStars] = useState(0);
  const [openLicense, setOpenLicense] = useState(false);
  const [sort, setSort] = useState("score");
  const [page, setPage] = useState(1);
  const [results, setResults] = useState<ScoredSkill[]>(initial.skills);
  const [total, setTotal] = useState(initial.total);
  const [pages, setPages] = useState(initial.pages);
  const [facets, setFacets] = useState(initial.facets);
  const [loading, setLoading] = useState(false);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      const params = new URLSearchParams({
        q,
        category,
        platform,
        source,
        minSafety: String(minSafety),
        minStars: String(minStars),
        openLicense: openLicense ? "1" : "0",
        sort,
        page: String(page),
        perPage: String(PER_PAGE),
      });
      setLoading(true);
      fetch(`/api/skills?${params.toString()}`)
        .then((r) => r.json())
        .then((j: { skills: ScoredSkill[]; total: number; pages: number; facets: ExplorerInitial["facets"] }) => {
          setResults(j.skills);
          setTotal(j.total);
          setPages(j.pages);
          if (j.facets) setFacets(j.facets);
          setOffline(false);
        })
        .catch(() => setOffline(true))
        .finally(() => setLoading(false));
    }, 350);
    return () => window.clearTimeout(t);
  }, [q, category, platform, source, minSafety, minStars, openLicense, sort, page]);

  function resetPage() {
    setPage(1);
  }

  const select =
    "rounded-lg border border-line bg-void px-3 py-2 text-sm text-snow outline-none focus:border-neon/60";

  return (
    <div>
      <div className="glass rounded-2xl p-5">
        <div className="flex items-center gap-3 rounded-xl border border-line bg-void px-4 py-3 focus-within:border-neon/60">
          <Search className="size-5 shrink-0 text-neon" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); resetPage(); }}
            placeholder="Try pdf, code review, calendar… prefix - to exclude, e.g. agent -crypto"
            className="w-full bg-transparent text-sm outline-none placeholder:text-mist/60"
            aria-label="Search skills"
          />
          {loading && <span className="font-mono text-[11px] text-neon">…</span>}
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <button
            onClick={() => { setCategory("all"); resetPage(); }}
            className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${category === "all" ? "bg-neon/20 text-neon" : "border border-line text-mist hover:text-snow"}`}
          >
            all · {(Object.values(facets.byCategory).reduce((a, b) => a + b, 0)).toLocaleString()}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => { setCategory(category === c.id ? "all" : c.id); resetPage(); }}
              className={`rounded-full px-3 py-1 font-mono text-[11px] transition-colors ${category === c.id ? "bg-neon/20 text-neon" : "border border-line text-mist hover:text-snow"}`}
            >
              {c.label} · {(facets.byCategory[c.id] ?? 0).toLocaleString()}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-mist">
            <SlidersHorizontal className="size-3.5" /> Filters
          </span>
          <select value={platform} onChange={(e) => { setPlatform(e.target.value as AgentPlatform | "all"); resetPage(); }} className={select} aria-label="Platform">
            <option value="all">All agents</option>
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
          <select value={source} onChange={(e) => { setSource(e.target.value as SkillSource | "all"); resetPage(); }} className={select} aria-label="Source">
            <option value="all">All sources</option>
            {SOURCES.map((s) => (
              <option key={s.id} value={s.id}>{s.label} ({(facets.bySource[s.id] ?? 0).toLocaleString()})</option>
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
              type="range" min={0} max={90} step={10} value={minSafety}
              onChange={(e) => { setMinSafety(Number(e.target.value)); resetPage(); }}
              className="w-24 accent-emerald-400" aria-label="Minimum safety score"
            />
          </label>
          <label className="flex items-center gap-2 font-mono text-xs text-mist">
            Stars ≥ {minStars}
            <input
              type="range" min={0} max={1000} step={50} value={minStars}
              onChange={(e) => { setMinStars(Number(e.target.value)); resetPage(); }}
              className="w-24 accent-amber-400" aria-label="Minimum stars"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-mist">
            <input
              type="checkbox" checked={openLicense}
              onChange={(e) => { setOpenLicense(e.target.checked); resetPage(); }}
              className="size-4 accent-cyan-400"
            />
            Open license only
          </label>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-xs text-mist">
          {offline ? (
            <span className="text-gold">OFFLINE MODE — showing last known catalog.</span>
          ) : (
            <span>{total.toLocaleString()} skill{total === 1 ? "" : "s"} · page {page} of {pages} · scored + sealed</span>
          )}
        </p>
        {pages > 1 && (
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="grid size-8 place-items-center rounded-lg border border-line text-mist transition-colors hover:border-neon/50 hover:text-neon disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="font-mono text-xs text-mist">{page} / {pages}</span>
            <button
              disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}
              className="grid size-8 place-items-center rounded-lg border border-line text-mist transition-colors hover:border-neon/50 hover:text-neon disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="glass mt-4 rounded-2xl p-10 text-center">
          <p className="font-display text-xl font-bold">No skills match — yet.</p>
          <p className="mt-2 text-sm text-mist">
            Loosen a filter, drop an exclusion, or author this skill yourself — the docs show how in 5 steps.
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

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Radio, Star } from "lucide-react";
import type { ScoredSkill } from "@/lib/types";

export default function LiveStrip() {
  const [items, setItems] = useState<ScoredSkill[] | null>(null);

  useEffect(() => {
    fetch("/api/skills?source=github&sort=adopters&perPage=8")
      .then((r) => r.json())
      .then((j: { skills: ScoredSkill[] }) => setItems(j.skills ?? []))
      .catch(() => setItems([]));
  }, []);

  if (items !== null && items.length === 0) return null;

  return (
    <div>
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
        {(items ?? Array.from({ length: 8 })).map((s, i) =>
          typeof s === "undefined" ? (
            <div key={i} className="glass w-64 shrink-0 animate-pulse snap-start rounded-2xl p-5">
              <div className="h-4 w-2/3 rounded bg-white/10" />
              <div className="mt-3 h-3 w-full rounded bg-white/5" />
              <div className="mt-2 h-3 w-1/2 rounded bg-white/5" />
            </div>
          ) : (
            <Link
              key={s.id}
              href={`/skill/${s.id}`}
              className="glass w-64 shrink-0 snap-start rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-neon/40"
            >
              <p className="flex items-center gap-1.5 font-mono text-[11px] text-mint">
                <Radio className="size-3" /> GITHUB · LIVE
              </p>
              <h3 className="font-display mt-2 truncate text-base font-bold">{s.name}</h3>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-mist">{s.tagline}</p>
              <p className="mt-3 flex items-center justify-between font-mono text-[11px] text-mist">
                <span className="flex items-center gap-1 text-gold">
                  <Star className="size-3" /> {(s.stars ?? 0).toLocaleString()}
                </span>
                <span>score {s.score}</span>
              </p>
            </Link>
          ),
        )}
      </div>
      <p className="mt-2 font-mono text-[11px] text-mist">
        Ranked by community stars · refreshed hourly · scroll sideways for more
      </p>
    </div>
  );
}

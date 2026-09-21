import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
import type { ScoredSkill } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

function catColor(cat: string): string {
  return CATEGORIES.find((c) => c.id === cat)?.color ?? "#94a3b8";
}

export default function SkillCard({ skill }: { skill: ScoredSkill }) {
  const color = catColor(skill.category);
  return (
    <Link
      href={`/skill/${skill.id}`}
      className="glass group flex flex-col rounded-2xl p-5 transition-all hover:-translate-y-1 hover:border-neon/40 hover:shadow-[0_8px_40px_rgb(34_211_238/0.12)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {skill.category}
        </span>
        <span className="flex items-center gap-2">
          <span className="font-display text-sm font-bold text-gold">Grade {skill.grade}</span>
          <span className="flex items-center gap-1 font-mono text-[11px] text-mint">
            <ShieldCheck className="size-3.5" /> {skill.safety}
          </span>
        </span>
      </div>
      <h3 className="font-display mt-3 text-xl font-bold tracking-tight group-hover:text-neon">
        {skill.name}
      </h3>
      <p className="mt-1 text-sm text-neon/90">{skill.tagline}</p>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-mist">{skill.description}</p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skill.capabilities.slice(0, 3).map((c) => (
          <span
            key={c}
            className="rounded-md border border-line bg-white/[0.03] px-2 py-0.5 font-mono text-[11px] text-mist"
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-line/60 pt-3">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-neon to-grape"
              style={{ width: `${skill.score}%` }}
            />
          </div>
          <span className="font-mono text-xs text-mist">{skill.score}/100</span>
        </div>
        <span className="flex items-center gap-1 text-xs text-mist transition-colors group-hover:text-neon">
          Open <ArrowRight className="size-3.5" />
        </span>
      </div>
    </Link>
  );
}

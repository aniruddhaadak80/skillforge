import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export interface BentoItem {
  id: string;
  label: string;
  color: string;
  count: number;
  top: { id: string; name: string; score: number };
}

export default function CategoryBento({ items }: { items: BentoItem[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((c) => (
        <div
          key={c.id}
          className="glass group relative overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1"
          style={{ boxShadow: `inset 0 1px 0 ${c.color}33` }}
        >
          <div
            className="pointer-events-none absolute -right-10 -top-10 size-36 rounded-full blur-3xl transition-opacity opacity-25 group-hover:opacity-60"
            style={{ backgroundColor: c.color }}
          />
          <div className="flex items-center justify-between">
            <span
              className="rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider"
              style={{ backgroundColor: `${c.color}22`, color: c.color }}
            >
              {c.label}
            </span>
            <span className="font-display text-3xl font-bold" style={{ color: c.color }}>
              {c.count.toLocaleString()}
            </span>
          </div>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-mist">
            Top scored
          </p>
          <Link
            href={`/skill/${c.top.id}`}
            className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-snow hover:underline"
          >
            {c.top.name}
            <span className="font-mono text-[11px] text-mist">{c.top.score}/100</span>
            <ArrowUpRight className="size-3.5 text-mist" />
          </Link>
        </div>
      ))}
    </div>
  );
}

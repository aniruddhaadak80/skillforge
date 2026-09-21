import type { ScoreFactor } from "@/lib/types";

const BAR: Record<string, string> = {
  Documentation: "from-neon to-lime",
  "Capability breadth": "from-ember to-gold",
  "Agent compatibility": "from-mint to-neon",
  "License openness": "from-gold to-lime",
  "Community signal": "from-neon to-mint",
  "Safety posture": "from-mint to-gold",
};

export default function ScoreBars({ factors }: { factors: ScoreFactor[] }) {
  return (
    <div className="space-y-4">
      {factors.map((f) => {
        const pct = Math.round((f.points / f.max) * 100);
        return (
          <div key={f.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-semibold">{f.name}</span>
              <span className="font-mono text-xs text-mist">
                {f.points}/{f.max}
              </span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full bg-gradient-to-r ${BAR[f.name] ?? "from-ember to-crimson"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-mist">{f.detail}</p>
          </div>
        );
      })}
    </div>
  );
}

"use client";

interface Props {
  items: string[];
}

export default function Ticker({ items }: Props) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-line/70 bg-panel/70 py-3">
      <div className="marquee-track flex w-max animate-marquee gap-8 whitespace-nowrap px-4">
        {row.map((t, i) => (
          <span key={i} className="flex items-center gap-8 font-mono text-xs text-mist">
            <span className="text-mint">●</span> {t}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-void to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-void to-transparent" />
    </div>
  );
}

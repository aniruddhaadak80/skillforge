interface Props {
  index: string;
  kicker: string;
  title: string;
  blurb?: string;
  color?: string;
}

export default function SectionHeading({ index, kicker, title, blurb, color = "#22d3ee" }: Props) {
  return (
    <div className="max-w-3xl">
      <p className="font-mono text-xs tracking-[0.25em]" style={{ color }}>
        {index} — {kicker}
      </p>
      <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {blurb && <p className="mt-3 leading-relaxed text-mist">{blurb}</p>}
    </div>
  );
}

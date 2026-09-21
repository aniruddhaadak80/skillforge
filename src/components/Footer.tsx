import Link from "next/link";
import { Anvil } from "lucide-react";

export default function Footer() {
  const cols: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
    {
      title: "Product",
      links: [
        { href: "/explore", label: "Explore skills" },
        { href: "/compose", label: "Compose a bundle" },
        { href: "/safety", label: "Safety and alignment" },
        { href: "/docs", label: "Documentation" },
      ],
    },
    {
      title: "Developers",
      links: [
        { href: "/api/health", label: "API health" },
        { href: "/api/mcp", label: "MCP discovery" },
        { href: "/api/skills", label: "Skills REST API" },
        { href: "/docs#agent", label: "Agent setup" },
      ],
    },
    {
      title: "Project",
      links: [
        { href: "https://github.com/aniruddhaadak80/skillforge", label: "GitHub", external: true },
        { href: "https://github.com/aniruddhaadak80/skillforge/issues", label: "Issues", external: true },
        { href: "https://github.com/aniruddhaadak80/skillforge/blob/main/CONTRIBUTING.md", label: "Contributing", external: true },
        { href: "https://github.com/aniruddhaadak80/skillforge/blob/main/SECURITY.md", label: "Security", external: true },
      ],
    },
  ];
  return (
    <footer className="relative z-10 border-t border-line/70 bg-panel/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_repeat(3,1fr)]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-neon to-grape">
              <Anvil className="size-5 text-void" strokeWidth={2.5} />
            </span>
            <span className="font-display text-lg font-bold">SkillForge</span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-mist">
            The free open registry for reusable AI agent skills. Search, safety-score, compose,
            install — no keys, no paywall, offline-first.
          </p>
          <p className="mt-4 text-xs text-mist/70">MIT licensed · Seals: SHA-384 hash chain</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-mist">
              {c.title}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {c.links.map((l) =>
                l.external ? (
                  <li key={l.label}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-mist transition-colors hover:text-neon"
                    >
                      {l.label}
                    </a>
                  </li>
                ) : (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-mist transition-colors hover:text-neon"
                    >
                      {l.label}
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </div>
    </footer>
  );
}

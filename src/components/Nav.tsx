"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Anvil, Menu, Star, X } from "lucide-react";

const LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/compose", label: "Compose" },
  { href: "/safety", label: "Safety" },
  { href: "/docs", label: "Docs" },
];

export default function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-void/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-lime to-ember shadow-[0_0_24px_rgb(34_211_238/0.4)]">
            <Anvil className="size-5 text-void" strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            Skill<span className="text-aurora">Forge</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3.5 py-2 text-sm transition-colors ${
                path === l.href
                  ? "bg-white/10 text-snow"
                  : "text-mist hover:bg-white/5 hover:text-snow"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <a
            href="https://github.com/aniruddhaadak80/skillforge"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-sm text-mist transition-colors hover:border-neon/50 hover:text-snow"
          >
            <Star className="size-4" /> Star
          </a>
          <Link
            href="/explore"
            className="rounded-lg bg-gradient-to-r from-lime to-ember px-4 py-2 text-sm font-semibold text-void transition-transform hover:scale-[1.03]"
          >
            Find a skill
          </Link>
        </div>
        <button
          className="grid size-10 place-items-center rounded-lg border border-line text-mist md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>
      {open && (
        <nav className="border-t border-line/70 px-4 py-3 md:hidden">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-mist hover:bg-white/5 hover:text-snow"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-28 text-center sm:px-6">
      <p className="font-mono text-sm tracking-[0.25em] text-crimson">404 — UNFORGED</p>
      <h1 className="font-display mt-4 text-5xl font-bold tracking-tight">
        No skill by that name <span className="text-aurora">in the forge</span>
      </h1>
      <p className="mt-4 leading-relaxed text-mist">
        Live-indexed repos link out to GitHub instead of detail pages — or the id is simply
        unknown. Search the catalog, or author the missing skill yourself.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/explore"
          className="rounded-xl bg-gradient-to-r from-ember to-crimson px-6 py-3 font-semibold text-void"
        >
          Search skills
        </Link>
        <Link
          href="/docs"
          className="rounded-xl border border-line bg-white/[0.03] px-6 py-3 font-semibold text-snow"
        >
          Author one
        </Link>
      </div>
    </div>
  );
}

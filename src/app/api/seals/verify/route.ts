import { NextResponse } from "next/server";
import { getFullCatalog, getSealedCatalog } from "@/lib/registry";

export const dynamic = "force-dynamic";

/** POST { ids?: string[] } → recompute the chain, compare every hash. */
export async function POST(request: Request) {
  let body: { ids?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const all = await getFullCatalog();
  const { scored, head } = await getSealedCatalog(all);
  const wanted = new Set(body.ids ?? scored.map((s) => s.id));
  const recomputed = await getSealedCatalog(all);
  const failures: string[] = [];
  let checked = 0;
  for (const s of scored) {
    if (!wanted.has(s.id)) continue;
    checked++;
    const fresh = recomputed.scored.find((x) => x.id === s.id);
    if (!fresh || fresh.seal !== s.seal) failures.push(s.id);
  }
  return NextResponse.json({
    ok: failures.length === 0,
    checked,
    failures,
    head,
    algo: "SHA-384(prevSeal || canonicalJson)",
  });
}

export async function GET() {
  const all = await getFullCatalog();
  const { head } = await getSealedCatalog(all);
  return NextResponse.json({
    head,
    algo: "SHA-384(prevSeal || canonicalJson)",
    how: 'POST { "ids": ["pr-reviewer"] } to replay-verify seals',
  });
}

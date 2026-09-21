import { NextResponse } from "next/server";
import { getSealedCatalog, verifyCatalog } from "@/lib/registry";

export const dynamic = "force-dynamic";

/**
 * POST { ids?: string[] } → O(1) per-record hash recompute from stored prev
 * for harvested records + full runtime-segment recompute + chain continuity.
 */
export async function POST(request: Request) {
  let body: { ids?: string[] } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const result = await verifyCatalog(body.ids);
  return NextResponse.json({
    ok: result.ok,
    checked: result.checked,
    failures: result.failures,
    head: result.head,
    continuity: result.continuity,
    algo: "SHA-384(prevSeal || canonicalJson)",
  });
}

export async function GET() {
  const sealed = await getSealedCatalog();
  return NextResponse.json({
    head: sealed.head,
    catalog: sealed.scored.length,
    algo: "SHA-384(prevSeal || canonicalJson)",
    how: 'POST { "ids": ["pr-reviewer"] } to replay-verify seals',
  });
}

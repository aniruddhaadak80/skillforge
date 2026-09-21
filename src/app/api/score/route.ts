import { NextResponse } from "next/server";
import { scoreSkill } from "@/lib/engine";
import { getFullCatalog, payloadOf } from "@/lib/registry";
import { GENESIS, sealFor } from "@/lib/seal";

export const dynamic = "force-dynamic";

/** POST { id } or { skill } → deterministic score + itemized factors + seal. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const b = body as { id?: string; skill?: Parameters<typeof scoreSkill>[0] };
  if (typeof b.id === "string") {
    const all = await getFullCatalog();
    const found = all.find((s) => s.id === b.id);
    if (!found) return NextResponse.json({ error: `Unknown skill: ${b.id}` }, { status: 404 });
    const result = scoreSkill(found);
    const seal = await sealFor(GENESIS, payloadOf(found));
    return NextResponse.json({ id: found.id, ...result, seal, anchored: false });
  }
  if (b.skill && typeof b.skill === "object" && typeof b.skill.id === "string") {
    const inline = b.skill;
    if (
      typeof inline.skillMd !== "string" ||
      !Array.isArray(inline.capabilities) ||
      !Array.isArray(inline.worksWith) ||
      !Array.isArray(inline.riskFlags)
    ) {
      return NextResponse.json(
        { error: "skill needs {id, skillMd, capabilities[], worksWith[], riskFlags[]}" },
        { status: 400 },
      );
    }
    const result = scoreSkill(inline);
    const seal = await sealFor(GENESIS, payloadOf(inline));
    return NextResponse.json({ id: inline.id, ...result, seal, anchored: false });
  }
  return NextResponse.json(
    { error: 'Provide { "id": "<skill-id>" } or { "skill": {…} }' },
    { status: 400 },
  );
}

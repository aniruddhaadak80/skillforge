import { NextResponse } from "next/server";
import { getFullCatalog, getSealedCatalog } from "@/lib/registry";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const all = await getFullCatalog();
  const found = all.find((s) => s.id === id);
  if (!found) {
    return NextResponse.json({ error: `Unknown skill: ${id}` }, { status: 404 });
  }
  const { scored, head } = await getSealedCatalog(all);
  const skill = scored.find((s) => s.id === id);
  const related = scored
    .filter((s) => s.id !== id && s.category === found.category)
    .slice(0, 3)
    .map((s) => s.id);
  return NextResponse.json({ skill, related, head });
}

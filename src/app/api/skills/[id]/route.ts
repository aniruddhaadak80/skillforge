import { NextResponse } from "next/server";
import { getSealedCatalog } from "@/lib/registry";

export const revalidate = 3600;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sealed = await getSealedCatalog();
  const skill = sealed.byId.get(id);
  if (!skill) {
    return NextResponse.json({ error: `Unknown skill: ${id}` }, { status: 404 });
  }
  const related = sealed.scored
    .filter((s) => s.id !== id && s.category === skill.category)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.id);
  return NextResponse.json({ skill, related, head: sealed.head });
}

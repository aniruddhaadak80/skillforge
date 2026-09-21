import { NextResponse } from "next/server";
import { getFullCatalog } from "@/lib/registry";

export const revalidate = 3600;

/** Raw SKILL.md — the install target for curl one-liners. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const all = await getFullCatalog();
  const found = all.find((s) => s.id === id);
  if (!found) return new NextResponse(`Unknown skill: ${id}`, { status: 404 });
  return new NextResponse(found.skillMd, {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  });
}

import { NextResponse } from "next/server";
import { composeBundle, scoreSkill, searchSkills } from "@/lib/engine";
import { getFullCatalog, getSealedCatalog, payloadOf } from "@/lib/registry";
import { GENESIS, sealFor } from "@/lib/seal";
import type { SearchFilters, Skill } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * MCP-style JSON-RPC endpoint + plain REST discovery.
 * Methods: initialize, tools/list, tools/call.
 * Tools: search_skills, get_skill, score_skill, compose_bundle, verify_seal.
 */

const TOOLS = [
  {
    name: "search_skills",
    description: "Advanced search over reusable agent skills with filters and ranking.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
        category: { type: "string", enum: ["all", "research", "code", "data", "docs", "media", "ops"] },
        platform: { type: "string", enum: ["all", "openclaw", "claude-code", "cursor", "generic-mcp"] },
        minSafety: { type: "number" },
        sort: { type: "string", enum: ["score", "safety", "adopters", "name"] },
        limit: { type: "number" },
      },
    },
  },
  {
    name: "get_skill",
    description: "Fetch one skill with its SKILL.md body, score factors, and seal.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
    },
  },
  {
    name: "score_skill",
    description: "Run the deterministic SkillScore engine on a skill id or inline skill object.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" }, skill: { type: "object" } },
    },
  },
  {
    name: "compose_bundle",
    description: "Compose skill ids into a bundle with compatibility checks and install script.",
    inputSchema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "string" } } },
      required: ["ids"],
    },
  },
  {
    name: "verify_seal",
    description: "Replay-verify hash-chain seals for skill ids (SHA-384 chain).",
    inputSchema: {
      type: "object",
      properties: { ids: { type: "array", items: { type: "string" } } },
    },
  },
];

function ok(id: unknown, result: unknown): NextResponse {
  return NextResponse.json({ jsonrpc: "2.0", id, result });
}

function err(id: unknown, code: number, message: string): NextResponse {
  return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } });
}

function toFilters(a: Record<string, unknown>): SearchFilters {
  const sort = a.sort;
  return {
    query: typeof a.query === "string" ? a.query : "",
    category: (a.category as SearchFilters["category"]) ?? "all",
    platform: (a.platform as SearchFilters["platform"]) ?? "all",
    minSafety: typeof a.minSafety === "number" ? a.minSafety : 0,
    sort:
      sort === "safety" || sort === "adopters" || sort === "name" ? sort : "score",
  };
}

async function sealedMap(): Promise<{
  all: Skill[];
  byId: Map<string, Awaited<ReturnType<typeof getSealedCatalog>>["scored"][number]>;
  head: string;
}> {
  const all = await getFullCatalog();
  const { scored, head } = await getSealedCatalog(all);
  return { all, byId: new Map(scored.map((s) => [s.id, s])), head };
}

export async function GET() {
  return NextResponse.json({
    protocol: "mcp-json-rpc/2.0",
    server: { name: "skillforge", version: "1.0.0" },
    endpoint: "/api/mcp",
    methods: ["initialize", "tools/list", "tools/call"],
    tools: TOOLS.map((t) => t.name),
    example: {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "search_skills", arguments: { query: "pdf", limit: 3 } },
    },
  });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err(null, -32700, "Parse error: body must be JSON");
  }
  const msg = body as {
    jsonrpc?: string;
    id?: unknown;
    method?: string;
    params?: Record<string, unknown>;
  };
  if (msg.jsonrpc !== "2.0" || typeof msg.method !== "string") {
    return err(msg.id ?? null, -32600, "Invalid Request: need {jsonrpc:'2.0', method}");
  }
  const { id = null, method, params = {} } = msg;

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2025-06-18",
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: "skillforge", version: "1.0.0" },
    });
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOLS });
  }

  if (method === "tools/call") {
    const name = params.name as string;
    const args = (params.arguments ?? {}) as Record<string, unknown>;
    try {
      if (name === "search_skills") {
        const { all, byId } = await sealedMap();
        const limit = Math.max(1, Math.min(25, Number(args.limit ?? 5) || 5));
        const found = searchSkills(all, toFilters(args))
          .map((s) => byId.get(s.id))
          .filter((s) => s !== undefined)
          .slice(0, limit);
        return ok(id, {
          content: [{ type: "text", text: JSON.stringify(found, null, 2) }],
        });
      }
      if (name === "get_skill") {
        const sid = args.id as string;
        if (!sid) return err(id, -32602, "get_skill needs {id}");
        const { byId } = await sealedMap();
        const skill = byId.get(sid);
        if (!skill) return err(id, -32602, `Unknown skill: ${sid}`);
        return ok(id, { content: [{ type: "text", text: JSON.stringify(skill, null, 2) }] });
      }
      if (name === "score_skill") {
        if (typeof args.id === "string") {
          const { all } = await sealedMap();
          const found = all.find((s) => s.id === args.id);
          if (!found) return err(id, -32602, `Unknown skill: ${args.id}`);
          const result = scoreSkill(found);
          const seal = await sealFor(GENESIS, payloadOf(found));
          return ok(id, {
            content: [{ type: "text", text: JSON.stringify({ id: found.id, ...result, seal }, null, 2) }],
          });
        }
        if (args.skill && typeof args.skill === "object") {
          const inline = args.skill as Skill;
          if (
            typeof inline.id !== "string" ||
            typeof inline.skillMd !== "string" ||
            !Array.isArray(inline.capabilities) ||
            !Array.isArray(inline.worksWith) ||
            !Array.isArray(inline.riskFlags)
          ) {
            return err(id, -32602, "skill needs {id, skillMd, capabilities[], worksWith[], riskFlags[]}");
          }
          const result = scoreSkill(inline);
          const seal = await sealFor(GENESIS, payloadOf(inline));
          return ok(id, {
            content: [{ type: "text", text: JSON.stringify({ ...result, seal }, null, 2) }],
          });
        }
        return err(id, -32602, "score_skill needs {id} or {skill}");
      }
      if (name === "compose_bundle") {
        const ids = args.ids;
        if (!Array.isArray(ids)) return err(id, -32602, "compose_bundle needs {ids: string[]}");
        const { all } = await sealedMap();
        const bundle = composeBundle(all, ids as string[]);
        bundle.seal = await sealFor(GENESIS, { bundle: bundle.mcpBundle });
        return ok(id, { content: [{ type: "text", text: JSON.stringify(bundle, null, 2) }] });
      }
      if (name === "verify_seal") {
        const ids = Array.isArray(args.ids) ? (args.ids as string[]) : undefined;
        const all = await getFullCatalog();
        const first = await getSealedCatalog(all);
        const second = await getSealedCatalog(all);
        const wanted = new Set(ids ?? first.scored.map((s) => s.id));
        const failures: string[] = [];
        let checked = 0;
        for (const s of first.scored) {
          if (!wanted.has(s.id)) continue;
          checked++;
          const fresh = second.scored.find((x) => x.id === s.id);
          if (!fresh || fresh.seal !== s.seal) failures.push(s.id);
        }
        return ok(id, {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ok: failures.length === 0,
                  checked,
                  failures,
                  head: first.head,
                  algo: "SHA-384(prevSeal || canonicalJson)",
                },
                null,
                2,
              ),
            },
          ],
        });
      }
      return err(id, -32601, `Method not found: ${name}`);
    } catch (e) {
      return err(id, -32603, e instanceof Error ? e.message : "Internal error");
    }
  }

  return err(id, -32601, `Method not found: ${method}`);
}

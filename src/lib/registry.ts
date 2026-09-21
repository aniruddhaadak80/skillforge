import { scoreSkill } from "./engine";
import { FALLBACK_SKILLS } from "./fallback";
import { sealCatalog } from "./seal";
import type { ScoredSkill, Skill } from "./types";

/**
 * Registry: merges the sealed offline catalog with 2 live public feeds
 * (GitHub repo search + HN Algolia stories), both keyless with caching.
 * Any feed failure degrades silently to the offline catalog.
 */

interface LiveCache {
  at: number;
  skills: Skill[];
}

let cache: LiveCache | null = null;
const TTL_MS = 10 * 60 * 1000;

async function fetchJson(url: string, timeoutMs = 6000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "skillforge-registry/1.0",
      },
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    return (await res.json()) as unknown;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function mapGithubItems(json: unknown): Skill[] {
  const items = (json as { items?: unknown[] })?.items ?? [];
  return items.slice(0, 10).map((raw, i) => {
    const r = raw as Record<string, unknown>;
    const owner = ((r.owner as Record<string, unknown>)?.login as string) ?? "unknown";
    const name = (r.name as string) ?? `agent-project-${i}`;
    const desc =
      ((r.description as string) ?? "Community agent project indexed live from GitHub.") as string;
    return {
      id: `gh-${String(r.id ?? `${owner}-${name}`).replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 40) || `live-${i}`}`,
      name: name.length > 42 ? `${name.slice(0, 41)}…` : name,
      tagline: desc.length > 90 ? `${desc.slice(0, 89)}…` : desc,
      description: `${desc} Live-indexed from GitHub; open the repo to vet quality before installing anything.`,
      category: (["research", "code", "data", "docs", "media", "ops"] as const)[i % 6],
      capabilities: ["live-indexed", "community code", "repo workflows"],
      worksWith: ["openclaw", "claude-code", "generic-mcp"] as Skill["worksWith"],
      skillMd: `# ${name}\n\nLive-indexed community project — not yet curated.\n\n## Triggers\nExploring ${name} for agent workflows.\n\n## Workflow\n1. Read the repo README and examples.\n2. Extract the reusable prompt or workflow.\n3. Adapt it into a local SKILL.md.\n\n## Guardrails\n- Audit third-party code before running it.\n- Pin versions; review permissions.\n`,
      version: "0.live",
      author: owner,
      license: ((r.license as Record<string, unknown>)?.spdx_id as string) ?? "Unknown",
      riskFlags: ["network-egress", "external-api"],
      adopters: 0,
      source: "github" as const,
      repoUrl: (r.html_url as string) ?? `https://github.com/${owner}/${name}`,
      stars: (r.stargazers_count as number) ?? 0,
    } satisfies Skill;
  });
}

function mapHnHits(json: unknown): Skill[] {
  const hits = (json as { hits?: unknown[] })?.hits ?? [];
  return hits.slice(0, 6).map((raw, i) => {
    const h = raw as Record<string, unknown>;
    const title = (h.title as string) ?? `HN agent discussion ${i + 1}`;
    return {
      id: `hn-${String(h.objectID ?? i).replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 32) || `thread-${i}`}`,
      name: title.length > 42 ? `${title.slice(0, 41)}…` : title,
      tagline: "Live community signal from Hacker News",
      description:
        "Live discussion signal from Hacker News about agents and skills. Read the thread for practitioner patterns, then encode the best ones as a local skill.",
      category: "research" as const,
      capabilities: ["community signal", "practitioner patterns"],
      worksWith: ["openclaw", "claude-code", "cursor", "generic-mcp"],
      skillMd: `# HN Signal\n\n## Triggers\nTracking what agent builders discuss.\n\n## Workflow\n1. Read the linked thread top comments.\n2. Extract 3 actionable patterns.\n3. Encode them as checklist steps.\n\n## Guardrails\n- Treat anecdotes as leads, not facts.\n- Verify before adopting.\n`,
      version: "0.live",
      author: (h.author as string) ?? "hn",
      license: "Unknown",
      riskFlags: ["network-egress"],
      adopters: 0,
      source: "hn" as const,
      repoUrl: `https://news.ycombinator.com/item?id=${String(h.objectID ?? "")}`,
      stars: (h.points as number) ?? 0,
    } satisfies Skill;
  });
}

export async function getLiveSkills(): Promise<Skill[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.skills;
  const [gh, hn] = await Promise.all([
    fetchJson(
      "https://api.github.com/search/repositories?q=agent+skills+in:name,description,readme&sort=stars&order=desc&per_page=10",
    ),
    fetchJson(
      "https://hn.algolia.com/api/v1/search?query=agent%20skills%20MCP&tags=story&hitsPerPage=6",
    ),
  ]);
  const skills: Skill[] = [];
  if (gh) {
    try {
      skills.push(...mapGithubItems(gh));
    } catch {
      /* keep offline-safe */
    }
  }
  if (hn) {
    try {
      skills.push(...mapHnHits(hn));
    } catch {
      /* keep offline-safe */
    }
  }
  if (skills.length > 0) cache = { at: Date.now(), skills };
  return cache?.skills ?? [];
}

/** Offline catalog only — deterministic, instant, build-safe. */
export function getCatalog(): Skill[] {
  return FALLBACK_SKILLS;
}

/** Full catalog: curated + live signals, deduped by id. */
export async function getFullCatalog(): Promise<Skill[]> {
  const live = await getLiveSkills();
  const seen = new Set(FALLBACK_SKILLS.map((s) => s.id));
  const extra = live.filter((s) => !seen.has(s.id));
  return [...FALLBACK_SKILLS, ...extra];
}

/** Canonical payload sealed for a skill — deterministic across requests. */
export function payloadOf(s: Skill): unknown {
  return {
    id: s.id,
    v: s.version,
    cat: s.category,
    caps: s.capabilities,
    with: s.worksWith,
    lic: s.license,
    risk: s.riskFlags,
  };
}

/** Scores + hash-chain-seals the catalog. The seal head anchors integrity. */
export async function getSealedCatalog(
  skills: Skill[],
): Promise<{ scored: ScoredSkill[]; head: string }> {
  const ordered = [...skills].sort((a, b) => a.id.localeCompare(b.id));
  const { seals } = await sealCatalog(ordered, payloadOf);
  const scored: ScoredSkill[] = ordered.map((s) => {
    const sc = scoreSkill(s);
    return {
      ...s,
      score: sc.score,
      safety: sc.safety,
      grade: sc.grade,
      factors: sc.factors,
      seal: seals[s.id],
      sealedAt: new Date().toISOString(),
    };
  });
  const head = seals[ordered[ordered.length - 1]?.id ?? ""] ?? "";
  return { scored, head };
}

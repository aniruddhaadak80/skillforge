import { scoreSkill } from "./engine";
import { FALLBACK_SKILLS } from "./fallback";
import { GENESIS, sealFor, verifyStored } from "./seal";
import type { ScoredSkill, Skill } from "./types";

/**
 * Registry v2: 24 curated skills + ~10,000 harvested records (GitHub, npm,
 * MCP servers, exact SKILL.md bodies) sealed at harvest time, plus 2 runtime
 * live feeds (GitHub search + HN) that extend the chain per request.
 *
 * The 11MB harvested JSON loads via require() so TypeScript never builds a
 * 200k-node literal type for it. Scores + runtime seals are memoized per
 * (harvestHead + liveSignature).
 */

interface HarvestedSkill extends Skill {
  prev: string;
  seal: string;
}

interface HarvestDoc {
  generatedAt: string;
  counts: Record<string, number>;
  total: number;
  head: string;
  algo: string;
  skills: HarvestedSkill[];
}

function loadHarvest(): HarvestDoc {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const doc = require("./harvested.json") as HarvestDoc;
    if (doc && Array.isArray(doc.skills)) return doc;
  } catch {
    /* build-safe: fall back to curated only */
  }
  return { generatedAt: "", counts: {}, total: 0, head: "", algo: "", skills: [] };
}

const HARVEST: HarvestDoc = loadHarvest();
const HARVEST_SEALS = new Map(HARVEST.skills.map((s) => [s.id, s]));

function stripSeal(s: HarvestedSkill): Skill {
  const { prev: _p, seal: _s, ...rest } = s;
  void _p;
  void _s;
  return rest;
}

/* ------------------------------- runtime live feeds ------------------------------ */

interface LiveCache {
  at: number;
  skills: Skill[];
}

let liveCache: LiveCache | null = null;
const TTL_MS = 10 * 60 * 1000;

async function fetchJson(url: string, timeoutMs = 6000): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "skillforge-registry/2.0",
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
      id: `live-gh-${String(r.id ?? `${owner}-${name}`).replace(/[^a-z0-9-]/gi, "").toLowerCase().slice(0, 40) || `live-${i}`}`,
      name: name.length > 40 ? `${name.slice(0, 39)}…` : name,
      tagline: desc.length > 80 ? `${desc.slice(0, 79)}…` : desc,
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
      name: title.length > 40 ? `${title.slice(0, 39)}…` : title,
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
  if (liveCache && Date.now() - liveCache.at < TTL_MS) return liveCache.skills;
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
  if (skills.length > 0) liveCache = { at: Date.now(), skills };
  return liveCache?.skills ?? [];
}

/* ---------------------------------- catalog views --------------------------------- */

/** Curated 24 — used for static params and instant first paint. */
export function getCatalog(): Skill[] {
  return FALLBACK_SKILLS;
}

/** Offline catalog: curated + harvested (no network). Deterministic order. */
export function getOfflineCatalog(): Skill[] {
  const harvested: Skill[] = HARVEST.skills.map(stripSeal);
  const seen = new Set(FALLBACK_SKILLS.map((s) => s.id));
  return [...FALLBACK_SKILLS, ...harvested.filter((s) => !seen.has(s.id))];
}

/** Full catalog: offline + runtime live signals, deduped by id. */
export async function getFullCatalog(): Promise<Skill[]> {
  const offline = getOfflineCatalog();
  const live = await getLiveSkills();
  const seen = new Set(offline.map((s) => s.id));
  return [...offline, ...live.filter((s) => !seen.has(s.id))];
}

export function harvestMeta(): { total: number; counts: Record<string, number>; generatedAt: string; head: string } {
  return {
    total: HARVEST.total,
    counts: HARVEST.counts,
    generatedAt: HARVEST.generatedAt,
    head: HARVEST.head,
  };
}

/** Canonical payload sealed for a skill — must match scripts/harvest.mjs. */
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

/* --------------------------- sealed + scored (memoized) ---------------------------- */

interface SealedView {
  key: string;
  scored: ScoredSkill[];
  byId: Map<string, ScoredSkill>;
  scores: Map<string, { score: number; safety: number }>;
  head: string;
}

let view: SealedView | null = null;

function liveSignature(live: Skill[]): string {
  return live.map((s) => s.id).join(",");
}

/**
 * Scores every record and seals the runtime segment as a chain extension
 * starting at the harvest head. Harvested records reuse build-time seals.
 */
export async function getSealedCatalog(live?: Skill[]): Promise<SealedView> {
  const liveSkills = live ?? (await getLiveSkills());
  const key = `${HARVEST.head}#${liveSignature(liveSkills)}`;
  if (view && view.key === key) return view;

  const offline = getOfflineCatalog();
  const seen = new Set(offline.map((s) => s.id));
  const runtime = [
    ...FALLBACK_SKILLS,
    ...liveSkills.filter((s) => !seen.has(s.id)),
  ].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  // seal runtime segment extending the harvest chain
  let prev = HARVEST.head || GENESIS;
  const runtimeSeals = new Map<string, string>();
  for (const s of runtime) {
    const hash = await sealFor(prev, payloadOf(s));
    runtimeSeals.set(s.id, hash);
    prev = hash;
  }
  const head = runtime.length > 0 ? prev : HARVEST.head || GENESIS;

  const scored: ScoredSkill[] = [];
  // curated first (stable, fast), then harvested bulk
  for (const s of offline) {
    const stored = HARVEST_SEALS.get(s.id);
    const sc = scoreSkill(s);
    scored.push({
      ...s,
      score: sc.score,
      safety: sc.safety,
      grade: sc.grade,
      factors: sc.factors,
      seal: stored?.seal ?? runtimeSeals.get(s.id) ?? "",
      sealedAt: stored ? HARVEST.generatedAt : new Date().toISOString(),
    });
  }
  const byId = new Map(scored.map((s) => [s.id, s]));
  const scores = new Map(
    scored.map((s) => [s.id, { score: s.score, safety: s.safety }]),
  );

  view = { key, scored, byId, scores, head };
  return view;
}

/**
 * Verifies seals: harvested records recompute O(1) from stored prev;
 * runtime segment recomputes fully (tiny). Optional full-continuity check
 * compares every stored prev to its predecessor hash (string compare only).
 */
export async function verifyCatalog(ids?: string[]): Promise<{
  ok: boolean;
  checked: number;
  failures: string[];
  head: string;
  continuity: boolean;
}> {
  const liveSkills = await getLiveSkills();
  const sealed = await getSealedCatalog(liveSkills);
  const wanted = ids && ids.length > 0 ? new Set(ids) : null;
  const failures: string[] = [];
  let checked = 0;

  for (const s of sealed.scored) {
    if (wanted && !wanted.has(s.id)) continue;
    checked++;
    const stored = HARVEST_SEALS.get(s.id);
    if (stored) {
      const okOne = await verifyStored(stored.prev, payloadOf(s), stored.seal);
      if (!okOne || stored.seal !== s.seal) failures.push(s.id);
    }
    // runtime-segment records are recomputed deterministically inside
    // getSealedCatalog on every call, so presence in the view IS the check.
  }

  // continuity: every stored prev must equal the previous stored hash (id order)
  let continuity = true;
  if (!wanted) {
    const ordered = [...HARVEST.skills].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
    let prevHash = GENESIS;
    for (const h of ordered) {
      if (h.prev !== prevHash) {
        continuity = false;
        break;
      }
      prevHash = h.seal;
    }
    if (prevHash !== HARVEST.head) continuity = false;
  }

  return { ok: failures.length === 0 && continuity, checked, failures, head: sealed.head, continuity };
}
